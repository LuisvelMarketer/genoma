/**
 * FitnessTracker — Tracks allele performance with 6D metrics and immune system
 *
 * @author DeepAgent (adapted from PGA Platform)
 * @since 2026-03-03
 */

import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import type {
    GenomeV2,
    FitnessVector,
    FitnessWeights,
    Layer,
    SelectionContext,
} from '../types/index.js';

const MAX_RECENT_SCORES = 10;
const IMMUNE_WINDOW_SIZE = 5;
const IMMUNE_DROP_THRESHOLD = 0.2;
const EMA_ALPHA = 0.1;

export interface FitnessScore {
    accuracy: number;
    speed: number;
    cost: number;
    safety: number;
    userSatisfaction: number;
    adaptability: number;
}

export class FitnessTracker {
    private defaultWeights: FitnessWeights = {
        accuracy: 0.25,
        speed: 0.15,
        cost: 0.15,
        safety: 0.20,
        userSatisfaction: 0.15,
        adaptability: 0.10,
    };

    constructor(
        private storage: StorageAdapter,
        private genome: GenomeV2,
    ) {}

    /**
     * Record performance using 6D metrics
     */
    async recordPerformance(
        layer: Layer,
        geneId: string,
        score: FitnessScore,
        context?: SelectionContext,
    ): Promise<void> {
        const composite = this.computeComposite(score);
        const gene = this.findGene(layer, geneId);

        if (!gene) {
            console.warn(`[FITNESS] Gene not found: Layer ${layer}/${geneId}`);
            return;
        }

        // Update fitness vector with EMA
        const oldFitness = gene.fitness;
        const newFitness: FitnessVector = {
            accuracy: this.ema(oldFitness.accuracy, score.accuracy),
            speed: this.ema(oldFitness.speed, score.speed),
            cost: this.ema(oldFitness.cost, score.cost),
            safety: this.ema(oldFitness.safety, score.safety),
            userSatisfaction: this.ema(oldFitness.userSatisfaction, score.userSatisfaction),
            adaptability: this.ema(oldFitness.adaptability, score.adaptability),
            composite: this.ema(oldFitness.composite, composite),
            sampleSize: oldFitness.sampleSize + 1,
            lastUpdated: new Date(),
            confidence: this.computeConfidence(oldFitness.sampleSize + 1),
        };

        gene.fitness = newFitness;
        gene.usageCount += 1;
        gene.lastUsed = new Date();
        gene.successRate = this.ema(gene.successRate, composite);

        // Save genome
        await this.storage.saveGenome(this.genome);

        // Check immune system (async, fire-and-forget)
        this.checkImmune(layer, geneId, composite, oldFitness.composite).catch(() => {});

        console.log(
            `[FITNESS] Recorded: L${layer}/${geneId} composite=${composite.toFixed(4)}`,
        );
    }

    /**
     * Record simple performance score (backward compatibility)
     */
    async recordSimpleScore(
        layer: Layer,
        geneId: string,
        score: number,
        _context?: SelectionContext,
    ): Promise<void> {
        await this.recordPerformance(layer, geneId, {
            accuracy: score,
            speed: 0.5,
            cost: 0.5,
            safety: 1.0,
            userSatisfaction: score,
            adaptability: 0.5,
        }, _context);
    }

    /**
     * Compute composite score from 6D metrics
     */
    computeComposite(score: FitnessScore, weights?: FitnessWeights): number {
        const w = weights || this.genome.config.fitnessWeights || this.defaultWeights;

        return (
            score.accuracy * w.accuracy +
            score.speed * w.speed +
            score.cost * w.cost +
            score.safety * w.safety +
            score.userSatisfaction * w.userSatisfaction +
            score.adaptability * w.adaptability
        );
    }

    /**
     * Get current fitness for a gene
     */
    getFitness(layer: Layer, geneId: string): FitnessVector | null {
        const gene = this.findGene(layer, geneId);
        return gene?.fitness || null;
    }

    /**
     * Get overall genome fitness
     */
    getGenomeFitness(): FitnessVector {
        return this.genome.fitness;
    }

    /**
     * Update genome-level fitness (aggregate of all genes)
     */
    async updateGenomeFitness(): Promise<void> {
        const allFitnesses: FitnessVector[] = [];

        // Collect fitness from all active genes in C1
        for (const gene of this.genome.chromosomes.c1.operations) {
            if (gene.fitness.sampleSize > 0) {
                allFitnesses.push(gene.fitness);
            }
        }

        if (allFitnesses.length === 0) return;

        // Average all fitness vectors
        const avgFitness: FitnessVector = {
            accuracy: this.avg(allFitnesses.map(f => f.accuracy)),
            speed: this.avg(allFitnesses.map(f => f.speed)),
            cost: this.avg(allFitnesses.map(f => f.cost)),
            safety: this.avg(allFitnesses.map(f => f.safety)),
            userSatisfaction: this.avg(allFitnesses.map(f => f.userSatisfaction)),
            adaptability: this.avg(allFitnesses.map(f => f.adaptability)),
            composite: this.avg(allFitnesses.map(f => f.composite)),
            sampleSize: allFitnesses.reduce((sum, f) => sum + f.sampleSize, 0),
            lastUpdated: new Date(),
            confidence: this.avg(allFitnesses.map(f => f.confidence)),
        };

        this.genome.fitness = avgFitness;
        await this.storage.saveGenome(this.genome);
    }

    // ─── Immune System ─────────────────────────────────────────

    private async checkImmune(
        layer: Layer,
        geneId: string,
        newScore: number,
        oldComposite: number,
    ): Promise<void> {
        // Don't rollback Layer 0 (immutable)
        if (layer === 0) return;

        const drop = oldComposite - newScore;

        if (drop > IMMUNE_DROP_THRESHOLD) {
            console.log(
                `[IMMUNE] Triggered: L${layer}/${geneId} drop=${drop.toFixed(3)}`
            );

            await this.storage.logMutation({
                genomeId: this.genome.id,
                layer,
                gene: geneId,
                variant: null,
                mutationType: 'immune_trigger',
                parentVariant: null,
                triggerReason: 'fitness_drop',
                deployed: false,
                details: { newScore, oldComposite, drop },
                timestamp: new Date(),
                createdAt: new Date(),
            });
        }
    }

    // ─── Helpers ───────────────────────────────────────────────

    private findGene(layer: Layer, geneId: string) {
        if (layer === 1) {
            return this.genome.chromosomes.c1.operations.find(g => g.id === geneId);
        }
        return null;
    }

    private ema(oldValue: number, newValue: number): number {
        return Math.round((EMA_ALPHA * newValue + (1 - EMA_ALPHA) * oldValue) * 10000) / 10000;
    }

    private avg(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((s, v) => s + v, 0) / values.length;
    }

    private computeConfidence(sampleSize: number): number {
        // Confidence grows logarithmically with samples
        return Math.min(1, Math.log10(sampleSize + 1) / 2);
    }
}

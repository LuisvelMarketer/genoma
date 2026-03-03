/**
 * PGAAgentWrapper - Wraps Genoma agents with PGA capabilities
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import type { LLMAdapter } from '../interfaces/LLMAdapter.js';
import type { GenomeV2, SelectionContext, FitnessVector } from '../types/index.js';
import type { FitnessScore } from '../core/FitnessTracker.js';
import { GenomeKernel } from '../core/GenomeKernel.js';
import { GenomeManager } from '../core/GenomeManager.js';
import { FitnessTracker } from '../core/FitnessTracker.js';
import { PromptAssembler } from '../core/PromptAssembler.js';
import { LayeredMemory } from '../memory/LayeredMemory.js';

export interface PGAAgentWrapperConfig {
    genomeId?: string;
    userId?: string;
    enableEvolution: boolean;
    enableMemory: boolean;
    mutationInterval: number;
    fitnessThreshold: number;
}

export interface PGAExecutionResult {
    response: string;
    assembledPrompt: string;
    fitness?: FitnessScore;
    metadata: {
        genomeId: string;
        genomeVersion: number;
        genesUsed: string[];
        latencyMs: number;
    };
}

export class PGAAgentWrapper {
    private kernel: GenomeKernel | null = null;
    private manager: GenomeManager;
    private tracker: FitnessTracker | null = null;
    private assembler: PromptAssembler | null = null;
    private memory: LayeredMemory | null = null;
    private genome: GenomeV2 | null = null;
    private interactionCount: number = 0;

    constructor(
        private storage: StorageAdapter,
        private llm: LLMAdapter,
        private config: PGAAgentWrapperConfig,
    ) {
        this.manager = new GenomeManager(storage);
    }

    /**
     * Initialize the wrapper with a genome
     */
    async initialize(): Promise<void> {
        // Load or create genome
        if (this.config.genomeId) {
            this.genome = await this.manager.loadGenome(this.config.genomeId);
        }

        if (!this.genome) {
            this.genome = await this.manager.createGenome({
                name: 'Genoma Agent Genome',
                config: {
                    mutationRate: 'balanced',
                    epsilonExplore: 0.1,
                    enableSandbox: true,
                    minFitnessImprovement: 0.05,
                    enableIntegrityCheck: true,
                    autoRollbackThreshold: 0.15,
                    allowInheritance: true,
                    minCompatibilityScore: 0.6,
                },
            });
        }

        // Initialize components
        this.kernel = new GenomeKernel(this.genome, {
            strictMode: true,
            autoRollback: true,
        });

        this.tracker = new FitnessTracker(this.storage, this.genome);
        this.assembler = new PromptAssembler(this.storage, this.genome);

        if (this.config.enableMemory) {
            this.memory = new LayeredMemory(this.storage, this.genome.id);
        }

        console.log(`[PGA] Initialized with genome ${this.genome.id} v${this.genome.version}`);
    }

    /**
     * Assemble an evolved prompt
     */
    async assemblePrompt(
        basePrompt: string,
        context?: SelectionContext,
        currentMessage?: string,
    ): Promise<string> {
        if (!this.kernel || !this.assembler) {
            throw new Error('PGAAgentWrapper not initialized');
        }

        // Verify C0 integrity
        this.kernel.verifyIntegrity();

        // Assemble PGA prompt
        const pgaPrompt = await this.assembler.assemblePrompt(context, currentMessage);

        // Combine with base prompt
        return `${basePrompt}\n\n---\n\n## PGA Evolved Instructions\n\n${pgaPrompt}`;
    }

    /**
     * Record performance after an interaction
     */
    async recordPerformance(
        response: string,
        context: SelectionContext,
        score?: FitnessScore,
    ): Promise<void> {
        if (!this.tracker || !this.genome) return;

        this.interactionCount++;

        // Use provided score or compute from response
        const fitnessScore: FitnessScore = score || {
            accuracy: 0.7,
            speed: 0.8,
            cost: 0.9,
            safety: 1.0,
            userSatisfaction: 0.7,
            adaptability: 0.6,
        };

        // Record for each active gene in C1
        for (const gene of this.genome.chromosomes.c1.operations) {
            await this.tracker.recordPerformance(1, gene.id, fitnessScore, context);
        }

        // Update genome-level fitness
        await this.tracker.updateGenomeFitness();

        // Check if mutation is needed
        if (
            this.config.enableEvolution &&
            this.interactionCount % this.config.mutationInterval === 0
        ) {
            await this.checkForMutation();
        }
    }

    /**
     * Learn from interaction (memory)
     */
    async learn(
        userId: string,
        fact: string,
        category?: string,
    ): Promise<void> {
        if (!this.memory) return;
        await this.memory.learn(userId, fact, { category });
    }

    /**
     * Get genome status
     */
    getStatus(): {
        genomeId: string;
        version: number;
        state: string;
        fitness: FitnessVector;
        interactionCount: number;
    } | null {
        if (!this.genome) return null;

        return {
            genomeId: this.genome.id,
            version: this.genome.version,
            state: this.genome.state,
            fitness: this.genome.fitness,
            interactionCount: this.interactionCount,
        };
    }

    /**
     * Check if genome needs mutation
     */
    private async checkForMutation(): Promise<void> {
        if (!this.genome || !this.kernel) return;

        const avgFitness = this.genome.fitness.composite;

        if (avgFitness < this.config.fitnessThreshold) {
            console.log(
                `[PGA] Fitness ${avgFitness.toFixed(3)} below threshold ${this.config.fitnessThreshold}. ` +
                `Mutation candidate identified.`
            );
            // Mutation logic would go here
        }
    }

    /**
     * Get the current genome
     */
    getGenome(): GenomeV2 | null {
        return this.genome;
    }

    /**
     * Create a snapshot for rollback
     */
    createSnapshot(reason: string): void {
        if (this.kernel) {
            this.kernel.createSnapshot(reason);
        }
    }
}

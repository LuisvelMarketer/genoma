/**
 * Genoma Storage Adapter
 * Connects PGA storage interface to Genoma's PostgreSQL database
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import type {
    Genome,
    UserDNA,
    MutationLog,
} from '../types/index.js';
import type { SemanticFact } from '../memory/LayeredMemory.js';
import { generateUUID } from '../utils/hash.js';

/**
 * In-memory storage adapter for development/testing
 * Replace with PostgreSQL adapter for production
 */
export class GenomaStorageAdapter implements StorageAdapter {
    private genomes: Map<string, Genome> = new Map();
    private userDNA: Map<string, UserDNA> = new Map();
    private mutations: MutationLog[] = [];
    private interactions: Map<string, any[]> = new Map();
    private feedback: any[] = [];
    private facts: Map<string, SemanticFact> = new Map();

    async initialize(): Promise<void> {
        console.log('[GenomaStorageAdapter] Initialized (in-memory mode)');
    }

    // ─── Genome Operations ────────────────────────────────────

    async saveGenome(genome: Genome): Promise<void> {
        this.genomes.set(genome.id, JSON.parse(JSON.stringify(genome)));
    }

    async loadGenome(genomeId: string): Promise<Genome | null> {
        const genome = this.genomes.get(genomeId);
        return genome ? JSON.parse(JSON.stringify(genome)) : null;
    }

    async deleteGenome(genomeId: string): Promise<void> {
        this.genomes.delete(genomeId);
    }

    async listGenomes(): Promise<Genome[]> {
        return Array.from(this.genomes.values()).map(g => JSON.parse(JSON.stringify(g)));
    }

    // ─── User DNA Operations ──────────────────────────────────

    async saveDNA(userId: string, genomeId: string, dna: UserDNA): Promise<void> {
        const key = `${userId}:${genomeId}`;
        this.userDNA.set(key, JSON.parse(JSON.stringify(dna)));
    }

    async loadDNA(userId: string, genomeId: string): Promise<UserDNA | null> {
        const key = `${userId}:${genomeId}`;
        const dna = this.userDNA.get(key);
        return dna ? JSON.parse(JSON.stringify(dna)) : null;
    }

    // ─── Mutation Logging ─────────────────────────────────────

    async logMutation(mutation: MutationLog): Promise<void> {
        this.mutations.push(JSON.parse(JSON.stringify(mutation)));
    }

    async getMutationHistory(genomeId: string, limit: number = 100): Promise<MutationLog[]> {
        return this.mutations
            .filter(m => m.genomeId === genomeId)
            .slice(-limit)
            .reverse();
    }

    async getGeneMutationHistory(genomeId: string, gene: string, limit: number = 50): Promise<MutationLog[]> {
        return this.mutations
            .filter(m => m.genomeId === genomeId && m.gene === gene)
            .slice(-limit)
            .reverse();
    }

    // ─── Interaction Recording ─────────────────────────────────

    async recordInteraction(interaction: {
        genomeId: string;
        userId: string;
        userMessage: string;
        assistantResponse: string;
        toolCalls: unknown[];
        score?: number;
        timestamp: Date;
    }): Promise<void> {
        const key = `${interaction.genomeId}:${interaction.userId}`;
        if (!this.interactions.has(key)) {
            this.interactions.set(key, []);
        }
        this.interactions.get(key)!.push({
            id: generateUUID(),
            ...interaction,
        });
    }

    async getRecentInteractions(genomeId: string, userId: string, limit: number = 10): Promise<unknown[]> {
        const key = `${genomeId}:${userId}`;
        const interactions = this.interactions.get(key) || [];
        return interactions.slice(-limit).reverse();
    }

    // ─── Feedback ─────────────────────────────────────────────

    async recordFeedback(feedback: {
        genomeId: string;
        userId: string;
        gene: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        timestamp: Date;
    }): Promise<void> {
        this.feedback.push({
            id: generateUUID(),
            ...feedback,
        });
    }

    // ─── Analytics ────────────────────────────────────────────

    async getAnalytics(genomeId: string): Promise<{
        totalMutations: number;
        totalInteractions: number;
        avgFitnessImprovement: number;
        userSatisfaction: number;
        topGenes: Array<{ gene: string; fitness: number }>;
    }> {
        const genomeMutations = this.mutations.filter(m => m.genomeId === genomeId);
        const genomeFeedback = this.feedback.filter(f => f.genomeId === genomeId);

        let totalInteractions = 0;
        for (const [key, interactions] of this.interactions) {
            if (key.startsWith(genomeId)) {
                totalInteractions += interactions.length;
            }
        }

        const positiveFeedback = genomeFeedback.filter(f => f.sentiment === 'positive').length;
        const userSatisfaction = genomeFeedback.length > 0
            ? positiveFeedback / genomeFeedback.length
            : 0.5;

        return {
            totalMutations: genomeMutations.length,
            totalInteractions,
            avgFitnessImprovement: 0.05, // Placeholder
            userSatisfaction,
            topGenes: [], // Would need genome data to compute
        };
    }

    // ─── Semantic Facts ───────────────────────────────────────

    async saveFact(fact: SemanticFact, userId: string, genomeId: string): Promise<void> {
        const key = fact.id || generateUUID();
        this.facts.set(key, { ...fact, id: key });
    }

    async getFacts(userId: string, genomeId: string, includeExpired: boolean = false): Promise<SemanticFact[]> {
        const now = new Date();
        return Array.from(this.facts.values()).filter(f => {
            if (!includeExpired && f.expiresAt && f.expiresAt < now) {
                return false;
            }
            return true;
        });
    }

    async getFact(factId: string): Promise<SemanticFact | null> {
        return this.facts.get(factId) || null;
    }

    async updateFact(factId: string, updates: Partial<SemanticFact>): Promise<void> {
        const fact = this.facts.get(factId);
        if (fact) {
            this.facts.set(factId, { ...fact, ...updates });
        }
    }

    async deleteFact(factId: string): Promise<void> {
        this.facts.delete(factId);
    }

    async deleteUserFacts(userId: string, genomeId: string): Promise<void> {
        // In a real implementation, filter by userId and genomeId
        this.facts.clear();
    }

    async cleanExpiredFacts(userId: string, genomeId: string): Promise<number> {
        const now = new Date();
        let deleted = 0;
        for (const [key, fact] of this.facts) {
            if (fact.expiresAt && fact.expiresAt < now) {
                this.facts.delete(key);
                deleted++;
            }
        }
        return deleted;
    }
}

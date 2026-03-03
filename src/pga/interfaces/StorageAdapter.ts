/**
 * Storage Adapter Interface
 * Makes PGA work with any database (Postgres, SQLite, etc.)
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type {
    Genome,
    UserDNA,
    MutationLog,
} from '../types/index.js';
import type { SemanticFact } from '../memory/LayeredMemory.js';

/**
 * Storage Adapter Interface
 * Implement this to use PGA with your preferred database.
 */
export interface StorageAdapter {
    /**
     * Initialize storage (create tables, indexes, etc.)
     */
    initialize(): Promise<void>;

    /**
     * Save genome state
     */
    saveGenome(genome: Genome): Promise<void>;

    /**
     * Load genome by ID
     */
    loadGenome(genomeId: string): Promise<Genome | null>;

    /**
     * Delete genome
     */
    deleteGenome(genomeId: string): Promise<void>;

    /**
     * List all genomes
     */
    listGenomes(): Promise<Genome[]>;

    /**
     * Save user DNA profile
     */
    saveDNA(userId: string, genomeId: string, dna: UserDNA): Promise<void>;

    /**
     * Load user DNA
     */
    loadDNA(userId: string, genomeId: string): Promise<UserDNA | null>;

    /**
     * Log mutation
     */
    logMutation(mutation: MutationLog): Promise<void>;

    /**
     * Get mutation history for a genome
     */
    getMutationHistory(genomeId: string, limit?: number): Promise<MutationLog[]>;

    /**
     * Get mutation history for a specific gene
     */
    getGeneMutationHistory(genomeId: string, gene: string, limit?: number): Promise<MutationLog[]>;

    /**
     * Record interaction
     */
    recordInteraction(interaction: {
        genomeId: string;
        userId: string;
        userMessage: string;
        assistantResponse: string;
        toolCalls: unknown[];
        score?: number;
        timestamp: Date;
    }): Promise<void>;

    /**
     * Get recent interactions
     */
    getRecentInteractions(genomeId: string, userId: string, limit?: number): Promise<unknown[]>;

    /**
     * Record feedback
     */
    recordFeedback(feedback: {
        genomeId: string;
        userId: string;
        gene: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        timestamp: Date;
    }): Promise<void>;

    /**
     * Get analytics for genome
     */
    getAnalytics(genomeId: string): Promise<{
        totalMutations: number;
        totalInteractions: number;
        avgFitnessImprovement: number;
        userSatisfaction: number;
        topGenes: Array<{ gene: string; fitness: number }>;
    }>;

    // ─── Semantic Facts (Layered Memory) ────────────────────

    saveFact(fact: SemanticFact, userId: string, genomeId: string): Promise<void>;
    getFacts(userId: string, genomeId: string, includeExpired?: boolean): Promise<SemanticFact[]>;
    getFact(factId: string): Promise<SemanticFact | null>;
    updateFact(factId: string, updates: Partial<SemanticFact>): Promise<void>;
    deleteFact(factId: string): Promise<void>;
    deleteUserFacts(userId: string, genomeId: string): Promise<void>;
    cleanExpiredFacts(userId: string, genomeId: string): Promise<number>;
}

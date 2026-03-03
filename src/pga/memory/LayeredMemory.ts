/**
 * LayeredMemory - Semantic fact storage and retrieval
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import { generateUUID } from '../utils/hash.js';

export interface SemanticFact {
    id: string;
    fact: string;
    category: string;
    confidence: number;
    source: string;
    expiresAt?: Date;
    accessCount: number;
    lastAccessed?: Date;
    createdAt: Date;
}

export interface MemoryConfig {
    maxFacts: number;
    defaultTTLDays: number;
    minConfidence: number;
}

export class LayeredMemory {
    private config: MemoryConfig = {
        maxFacts: 100,
        defaultTTLDays: 30,
        minConfidence: 0.5,
    };

    constructor(
        private storage: StorageAdapter,
        private genomeId: string,
        config?: Partial<MemoryConfig>,
    ) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }

    /**
     * Learn a new fact
     */
    async learn(
        userId: string,
        fact: string,
        options?: {
            category?: string;
            confidence?: number;
            source?: string;
            ttlDays?: number;
        },
    ): Promise<SemanticFact> {
        const now = new Date();
        const ttlDays = options?.ttlDays ?? this.config.defaultTTLDays;

        const semanticFact: SemanticFact = {
            id: generateUUID(),
            fact,
            category: options?.category || 'general',
            confidence: options?.confidence ?? 0.7,
            source: options?.source || 'interaction',
            expiresAt: ttlDays > 0 ? new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000) : undefined,
            accessCount: 0,
            createdAt: now,
        };

        await this.storage.saveFact(semanticFact, userId, this.genomeId);
        return semanticFact;
    }

    /**
     * Get relevant facts for context
     */
    async getRelevantFacts(
        userId: string,
        query?: string,
        limit: number = 10,
    ): Promise<SemanticFact[]> {
        const facts = await this.storage.getFacts(userId, this.genomeId, false);

        // Filter by minimum confidence
        let relevant = facts.filter(f => f.confidence >= this.config.minConfidence);

        // Sort by confidence and recency
        relevant.sort((a, b) => {
            const scoreA = a.confidence * 0.7 + (a.accessCount / 100) * 0.3;
            const scoreB = b.confidence * 0.7 + (b.accessCount / 100) * 0.3;
            return scoreB - scoreA;
        });

        // Limit results
        relevant = relevant.slice(0, limit);

        // Update access counts
        for (const fact of relevant) {
            await this.storage.updateFact(fact.id, {
                accessCount: fact.accessCount + 1,
                lastAccessed: new Date(),
            });
        }

        return relevant;
    }

    /**
     * Get memory prompt for injection
     */
    async getMemoryPrompt(userId: string, limit: number = 5): Promise<string | null> {
        const facts = await this.getRelevantFacts(userId, undefined, limit);

        if (facts.length === 0) return null;

        const factsList = facts
            .map(f => `- ${f.fact} (confidence: ${(f.confidence * 100).toFixed(0)}%)`)
            .join('\n');

        return `## Remembered Context\n\n${factsList}`;
    }

    /**
     * Forget a specific fact
     */
    async forget(factId: string): Promise<void> {
        await this.storage.deleteFact(factId);
    }

    /**
     * Clear all user facts
     */
    async clearUserMemory(userId: string): Promise<void> {
        await this.storage.deleteUserFacts(userId, this.genomeId);
    }

    /**
     * Clean up expired facts
     */
    async cleanup(userId: string): Promise<number> {
        return this.storage.cleanExpiredFacts(userId, this.genomeId);
    }

    /**
     * Update fact confidence based on feedback
     */
    async reinforceFact(factId: string, positive: boolean): Promise<void> {
        const fact = await this.storage.getFact(factId);
        if (!fact) return;

        const delta = positive ? 0.1 : -0.1;
        const newConfidence = Math.max(0, Math.min(1, fact.confidence + delta));

        await this.storage.updateFact(factId, { confidence: newConfidence });
    }
}

/**
 * MutationOperator - Handles gene mutations
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { LLMAdapter } from '../interfaces/LLMAdapter.js';
import type { OperativeGene, FitnessVector, MutationType } from '../types/index.js';
import { generateUUID } from '../utils/hash.js';

export interface MutationStrategy {
    type: 'llm_rewrite' | 'parameter_tweak' | 'combine' | 'simplify';
    temperature?: number;
    context?: string;
}

export interface MutationResult {
    success: boolean;
    originalGene: OperativeGene;
    mutatedGene?: OperativeGene;
    strategy: MutationStrategy;
    reason?: string;
}

export class MutationOperator {
    constructor(private llm?: LLMAdapter) {}

    /**
     * Generate a mutation for a gene
     */
    async mutate(
        gene: OperativeGene,
        strategy: MutationStrategy,
        context?: string,
    ): Promise<MutationResult> {
        switch (strategy.type) {
            case 'llm_rewrite':
                return this.llmRewrite(gene, strategy, context);
            case 'parameter_tweak':
                return this.parameterTweak(gene, strategy);
            case 'simplify':
                return this.simplify(gene, strategy);
            case 'combine':
                return this.combine(gene, strategy);
            default:
                return {
                    success: false,
                    originalGene: gene,
                    strategy,
                    reason: 'Unknown strategy',
                };
        }
    }

    /**
     * LLM-based rewrite of gene content
     */
    private async llmRewrite(
        gene: OperativeGene,
        strategy: MutationStrategy,
        context?: string,
    ): Promise<MutationResult> {
        if (!this.llm) {
            return {
                success: false,
                originalGene: gene,
                strategy,
                reason: 'No LLM adapter configured',
            };
        }

        try {
            const prompt = `You are improving an AI instruction gene.

Original instruction:
${gene.content}

Category: ${gene.category}
Current fitness: ${gene.fitness.composite.toFixed(3)}
${context ? `Context: ${context}` : ''}

Rewrite this instruction to be more effective. Keep the same intent but improve clarity and effectiveness.

Respond with ONLY the improved instruction, no explanation.`;

            const response = await this.llm.chat([
                { role: 'user', content: prompt },
            ], {
                temperature: strategy.temperature ?? 0.7,
                maxTokens: 500,
            });

            const mutatedGene: OperativeGene = {
                ...gene,
                id: generateUUID(),
                content: response.content.trim(),
                origin: 'mutation',
                sourceGeneId: gene.id,
                usageCount: 0,
                lastUsed: new Date(),
                fitness: this.inheritFitness(gene.fitness),
            };

            return {
                success: true,
                originalGene: gene,
                mutatedGene,
                strategy,
            };
        } catch (error) {
            return {
                success: false,
                originalGene: gene,
                strategy,
                reason: `LLM error: ${error}`,
            };
        }
    }

    /**
     * Parameter-based tweaking (non-LLM)
     */
    private async parameterTweak(
        gene: OperativeGene,
        strategy: MutationStrategy,
    ): Promise<MutationResult> {
        // Simple text modifications
        let content = gene.content;

        // Add emphasis
        if (Math.random() < 0.5) {
            content = content.replace(/\bimportant\b/gi, 'CRITICAL');
            content = content.replace(/\bshould\b/gi, 'MUST');
        }

        const mutatedGene: OperativeGene = {
            ...gene,
            id: generateUUID(),
            content,
            origin: 'mutation',
            sourceGeneId: gene.id,
            usageCount: 0,
            lastUsed: new Date(),
            fitness: this.inheritFitness(gene.fitness),
        };

        return {
            success: true,
            originalGene: gene,
            mutatedGene,
            strategy,
        };
    }

    /**
     * Simplify a gene
     */
    private async simplify(
        gene: OperativeGene,
        strategy: MutationStrategy,
    ): Promise<MutationResult> {
        // Remove redundant phrases
        let content = gene.content;
        content = content.replace(/\b(basically|essentially|actually|really)\b/gi, '');
        content = content.replace(/\s+/g, ' ').trim();

        const mutatedGene: OperativeGene = {
            ...gene,
            id: generateUUID(),
            content,
            origin: 'mutation',
            sourceGeneId: gene.id,
            usageCount: 0,
            lastUsed: new Date(),
            fitness: this.inheritFitness(gene.fitness),
        };

        return {
            success: true,
            originalGene: gene,
            mutatedGene,
            strategy,
        };
    }

    /**
     * Combine genes (placeholder)
     */
    private async combine(
        gene: OperativeGene,
        strategy: MutationStrategy,
    ): Promise<MutationResult> {
        // Would combine multiple genes - placeholder
        return {
            success: false,
            originalGene: gene,
            strategy,
            reason: 'Combine requires multiple genes',
        };
    }

    /**
     * Inherit fitness with slight degradation
     */
    private inheritFitness(parentFitness: FitnessVector): FitnessVector {
        const degradation = 0.95; // 5% degradation for new mutations
        return {
            ...parentFitness,
            accuracy: parentFitness.accuracy * degradation,
            speed: parentFitness.speed * degradation,
            cost: parentFitness.cost * degradation,
            safety: parentFitness.safety * degradation,
            userSatisfaction: parentFitness.userSatisfaction * degradation,
            adaptability: parentFitness.adaptability * degradation,
            composite: parentFitness.composite * degradation,
            sampleSize: 0,
            confidence: 0,
            lastUpdated: new Date(),
        };
    }
}

/**
 * Evaluator - Evaluates response quality
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { LLMAdapter } from '../interfaces/LLMAdapter.js';
import type { FitnessScore } from '../core/FitnessTracker.js';

export interface EvaluationInput {
    userMessage: string;
    assistantResponse: string;
    context?: string;
    expectedBehavior?: string;
}

export interface EvaluationOutput {
    score: FitnessScore;
    explanation: string;
    suggestions: string[];
}

export class Evaluator {
    constructor(private llm?: LLMAdapter) {}

    /**
     * Evaluate a response using heuristics
     */
    async evaluateHeuristic(input: EvaluationInput): Promise<EvaluationOutput> {
        const response = input.assistantResponse;

        // Heuristic scoring
        const lengthScore = this.scoreLengthAppropriate(response, input.userMessage);
        const formatScore = this.scoreFormatting(response);
        const safetyScore = this.scoreSafety(response);

        const score: FitnessScore = {
            accuracy: 0.7, // Would need ground truth to measure
            speed: 0.8, // Would need timing data
            cost: this.scoreCost(response),
            safety: safetyScore,
            userSatisfaction: (lengthScore + formatScore) / 2,
            adaptability: 0.5, // Would need history
        };

        return {
            score,
            explanation: 'Heuristic evaluation based on length, format, and safety.',
            suggestions: this.generateSuggestions(score),
        };
    }

    /**
     * Evaluate using LLM-as-judge
     */
    async evaluateWithLLM(input: EvaluationInput): Promise<EvaluationOutput> {
        if (!this.llm) {
            return this.evaluateHeuristic(input);
        }

        const prompt = `Evaluate this AI assistant response.

User message: ${input.userMessage}

Assistant response: ${input.assistantResponse}

Rate each dimension from 0 to 1:
1. Accuracy: Is the response correct and factual?
2. Helpfulness: Does it address the user's need?
3. Safety: Is it appropriate and harmless?
4. Clarity: Is it well-structured and clear?

Provide ratings in JSON format:
{"accuracy": 0.X, "helpfulness": 0.X, "safety": 0.X, "clarity": 0.X, "explanation": "..."}`;

        try {
            const response = await this.llm.chat([
                { role: 'user', content: prompt },
            ], {
                temperature: 0.3,
                maxTokens: 500,
            });

            const parsed = this.parseEvaluation(response.content);
            return parsed;
        } catch (error) {
            console.warn('[Evaluator] LLM evaluation failed, falling back to heuristics');
            return this.evaluateHeuristic(input);
        }
    }

    // ─── Heuristic Scorers ─────────────────────────────────────

    private scoreLengthAppropriate(response: string, query: string): number {
        const responseLen = response.length;
        const queryLen = query.length;

        // Short queries should have medium responses
        // Long queries might need longer responses
        const ratio = responseLen / Math.max(queryLen, 1);

        if (ratio < 0.5) return 0.4; // Too short
        if (ratio > 50) return 0.5; // Too long
        if (ratio >= 2 && ratio <= 10) return 0.9; // Good ratio
        return 0.7; // Acceptable
    }

    private scoreFormatting(response: string): number {
        let score = 0.5;

        // Has structure (headers, lists, code blocks)
        if (response.includes('\n')) score += 0.1;
        if (response.includes('- ') || response.includes('* ')) score += 0.1;
        if (response.includes('```')) score += 0.1;
        if (response.includes('#')) score += 0.1;

        return Math.min(1, score);
    }

    private scoreSafety(response: string): number {
        const unsafePatterns = [
            /password/i,
            /hack/i,
            /illegal/i,
            /harm/i,
        ];

        for (const pattern of unsafePatterns) {
            if (pattern.test(response)) {
                return 0.7; // Slightly reduced for containing sensitive terms
            }
        }

        return 1.0;
    }

    private scoreCost(response: string): number {
        // Longer responses cost more tokens
        const tokens = response.length / 4;
        if (tokens < 100) return 1.0;
        if (tokens < 500) return 0.9;
        if (tokens < 1000) return 0.7;
        return 0.5;
    }

    private generateSuggestions(score: FitnessScore): string[] {
        const suggestions: string[] = [];

        if (score.cost < 0.7) {
            suggestions.push('Consider more concise responses');
        }
        if (score.safety < 0.9) {
            suggestions.push('Review safety guidelines');
        }
        if (score.userSatisfaction < 0.7) {
            suggestions.push('Improve response structure');
        }

        return suggestions;
    }

    private parseEvaluation(content: string): EvaluationOutput {
        try {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    score: {
                        accuracy: parsed.accuracy || 0.5,
                        speed: 0.8,
                        cost: 0.8,
                        safety: parsed.safety || 0.9,
                        userSatisfaction: (parsed.helpfulness || 0.5 + parsed.clarity || 0.5) / 2,
                        adaptability: 0.5,
                    },
                    explanation: parsed.explanation || 'LLM evaluation',
                    suggestions: [],
                };
            }
        } catch (e) {
            // Fall through to default
        }

        return {
            score: {
                accuracy: 0.5,
                speed: 0.8,
                cost: 0.8,
                safety: 1.0,
                userSatisfaction: 0.5,
                adaptability: 0.5,
            },
            explanation: 'Could not parse LLM response',
            suggestions: [],
        };
    }
}

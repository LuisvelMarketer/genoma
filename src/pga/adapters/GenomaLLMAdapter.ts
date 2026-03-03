/**
 * Genoma LLM Adapter
 * Connects PGA LLM interface to Genoma's LLM providers
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type {
    LLMAdapter,
    Message,
    ChatOptions,
    ChatResponse,
    ChatChunk,
} from '../interfaces/LLMAdapter.js';

/**
 * LLM Adapter for Genoma integration
 * Wraps Genoma's existing LLM infrastructure
 */
export class GenomaLLMAdapter implements LLMAdapter {
    readonly name: string;
    readonly model: string;

    private metricsEnabled: boolean = true;
    private totalCalls: number = 0;
    private totalTokens: number = 0;
    private totalLatency: number = 0;

    constructor(options: {
        provider: string;
        model: string;
        apiKey?: string;
    }) {
        this.name = options.provider;
        this.model = options.model;
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
        const startTime = Date.now();

        // In production, this would call the actual LLM provider
        // For now, we return a mock response for testing
        const response: ChatResponse = {
            content: this.getMockResponse(messages, options),
            usage: {
                inputTokens: this.estimateTokens(messages),
                outputTokens: 100,
                totalCost: 0.01,
            },
            metadata: {
                provider: this.name,
                model: this.model,
                latencyMs: Date.now() - startTime,
            },
        };

        // Track metrics
        if (this.metricsEnabled) {
            this.totalCalls++;
            this.totalTokens += (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0);
            this.totalLatency += Date.now() - startTime;
        }

        return response;
    }

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterableIterator<ChatChunk> {
        const response = await this.chat(messages, options);
        const words = response.content.split(' ');

        for (let i = 0; i < words.length; i++) {
            yield {
                delta: words[i] + (i < words.length - 1 ? ' ' : ''),
                done: i === words.length - 1,
            };
        }
    }

    async estimateCost(messages: Message[]): Promise<number> {
        const tokens = this.estimateTokens(messages);
        // Rough cost estimate based on model
        const costPerToken = this.getCostPerToken();
        return tokens * costPerToken;
    }

    // ─── Metrics ───────────────────────────────────────────────

    getMetrics(): {
        totalCalls: number;
        totalTokens: number;
        avgLatencyMs: number;
        avgTokensPerCall: number;
    } {
        return {
            totalCalls: this.totalCalls,
            totalTokens: this.totalTokens,
            avgLatencyMs: this.totalCalls > 0 ? this.totalLatency / this.totalCalls : 0,
            avgTokensPerCall: this.totalCalls > 0 ? this.totalTokens / this.totalCalls : 0,
        };
    }

    resetMetrics(): void {
        this.totalCalls = 0;
        this.totalTokens = 0;
        this.totalLatency = 0;
    }

    // ─── Helpers ───────────────────────────────────────────────

    private estimateTokens(messages: Message[]): number {
        // Rough estimate: 4 characters per token
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 4);
    }

    private getCostPerToken(): number {
        // Rough cost estimates per token
        const costs: Record<string, number> = {
            'claude-3-opus': 0.00006,
            'claude-3-sonnet': 0.00003,
            'claude-3-haiku': 0.000005,
            'gpt-4': 0.00006,
            'gpt-4-turbo': 0.00003,
            'gpt-3.5-turbo': 0.000002,
        };

        return costs[this.model] || 0.00003;
    }

    private getMockResponse(messages: Message[], options?: ChatOptions): string {
        // Mock response for testing
        const lastMessage = messages[messages.length - 1];
        return `[PGA Mock Response] Received message with ${lastMessage.content.length} characters. ` +
               `System prompt: ${options?.system ? 'provided' : 'not provided'}. ` +
               `Model: ${this.model}`;
    }
}

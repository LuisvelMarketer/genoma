/**
 * LLM Adapter Interface
 * Makes PGA work with any LLM provider (Claude, GPT, Gemini, etc.)
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatOptions {
    maxTokens?: number;
    temperature?: number;
    system?: string;
    tools?: unknown[];
}

export interface ChatResponse {
    content: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalCost?: number;
    };
    metadata?: Record<string, unknown>;
}

export interface ChatChunk {
    delta: string;
    done: boolean;
}

/**
 * LLM Adapter Interface
 * Implement this to use PGA with your preferred LLM provider.
 */
export interface LLMAdapter {
    /**
     * Provider name (e.g., 'anthropic', 'openai', 'google')
     */
    readonly name: string;

    /**
     * Model identifier (e.g., 'claude-sonnet-4.5', 'gpt-4')
     */
    readonly model: string;

    /**
     * Send a message to the LLM and get a response
     */
    chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;

    /**
     * Stream a response (optional - return null if not supported)
     */
    stream?(messages: Message[], options?: ChatOptions): AsyncIterableIterator<ChatChunk>;

    /**
     * Estimate token cost for messages (optional - return 0 if not supported)
     */
    estimateCost?(messages: Message[]): Promise<number>;
}

/**
 * LLM Adapter interface — compatibility layer
 * Will be replaced by @gsep/core LLMAdapter when integrated.
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMAdapter {
  chat(messages: Message[]): Promise<{
    content: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
}

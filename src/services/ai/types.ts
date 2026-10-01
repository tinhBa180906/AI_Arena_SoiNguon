export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface AIContext {
    culturalContext: string;
    guardContext: string;
}

export type ProviderStatus = 'local' | 'cloud' | 'offline';

export interface AdvisorResult {
    answer: string;
    providerStatus: ProviderStatus | null;
    source: 'faq' | 'cache' | 'ollama' | 'gemini' | 'unavailable';
    isError?: boolean;
}

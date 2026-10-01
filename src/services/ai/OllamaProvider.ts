import type { AIProvider } from './AIProvider';
import { isLocalAIEnvironment } from './environment';
import type { ChatMessage } from './types';

interface OllamaResponse {
    message?: {
        content?: string;
    };
}

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen3:4b';
const OLLAMA_TIMEOUT_MS = 60_000;

const getOllamaBaseUrl = () => {
    const configuredUrl = (import.meta.env.VITE_OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL).replace(/\/$/, '');

    // The Vite proxy avoids browser CORS restrictions when Ollama is local.
    if (import.meta.env.DEV && /^https?:\/\/(localhost|127\.0\.0\.1):11434$/i.test(configuredUrl)) {
        return '/ollama';
    }

    return configuredUrl;
};

const cleanModelResponse = (content: string) => {
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
};

export class OllamaProvider implements AIProvider {
    readonly name = 'Ollama';

    async chat(messages: ChatMessage[], context?: string): Promise<string> {
        if (!isLocalAIEnvironment()) {
            throw new Error('Ollama chỉ khả dụng trên localhost hoặc 127.0.0.1.');
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
        const requestMessages = context
            ? [{ role: 'system' as const, content: context }, ...messages]
            : messages;

        try {
            const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: import.meta.env.VITE_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
                    messages: requestMessages,
                    stream: false,
                    options: {
                        num_predict: 600,
                        temperature: 0.4,
                    },
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Ollama trả về HTTP ${response.status}.`);
            }

            const data = await response.json() as OllamaResponse;
            const content = cleanModelResponse(data.message?.content || '');

            if (!content) {
                throw new Error('Ollama trả về dữ liệu không hợp lệ.');
            }

            return content;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new Error('Ollama phản hồi quá thời gian cho phép.');
            }

            throw error instanceof Error ? error : new Error('Không thể kết nối Ollama.');
        } finally {
            window.clearTimeout(timeout);
        }
    }
}

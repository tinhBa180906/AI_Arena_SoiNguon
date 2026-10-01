import type { AIProvider } from './AIProvider';
import type { AIContext, ChatMessage } from './types';

interface ChatApiResponse {
    text?: string;
    provider?: string;
    error?: string;
}

const GEMINI_TIMEOUT_MS = 45_000;

export class GeminiProvider implements AIProvider {
    readonly name = 'Gemini';

    async chat(messages: ChatMessage[], context?: AIContext): Promise<string> {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, context }),
                signal: controller.signal,
            });
            const data = await response.json().catch(() => null) as ChatApiResponse | null;

            if (!response.ok) {
                throw new Error(data?.error || `API chat trả về HTTP ${response.status}.`);
            }

            const content = data?.text?.trim();

            if (!content || data?.provider !== 'gemini') {
                throw new Error('API chat trả về dữ liệu không hợp lệ.');
            }

            return content;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new Error('Gemini phản hồi quá thời gian cho phép.');
            }

            throw error instanceof Error ? error : new Error('Không thể kết nối Gemini.');
        } finally {
            window.clearTimeout(timeout);
        }
    }
}

import type { AIProvider } from './AIProvider';
import type { ChatMessage } from './types';

interface GeminiResponse {
    candidates?: Array<{
        finishReason?: string;
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 45_000;

const getGeminiEndpoint = (apiKey: string) => {
    const modelPath = `/v1beta/models/${GEMINI_MODEL}:generateContent`;

    if (import.meta.env.DEV) {
        return `/gemini${modelPath}`;
    }

    return `https://generativelanguage.googleapis.com${modelPath}?key=${encodeURIComponent(apiKey)}`;
};

export class GeminiProvider implements AIProvider {
    readonly name = 'Gemini';

    get isConfigured() {
        return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim());
    }

    async chat(messages: ChatMessage[], context?: string): Promise<string> {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
        if (!apiKey) {
            throw new Error('Gemini chưa được cấu hình API key.');
        }

        const systemParts = messages
            .filter((message) => message.role === 'system')
            .map((message) => message.content);
        if (context) systemParts.unshift(context);

        const contents = messages
            .filter((message) => message.role !== 'system')
            .map((message) => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: message.content }],
            }));
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        try {
            const response = await fetch(
                getGeminiEndpoint(apiKey),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemParts.join('\n\n') }],
                        },
                        contents,
                        generationConfig: {
                            temperature: 0.4,
                            maxOutputTokens: 800,
                            thinkingConfig: {
                                thinkingBudget: 0,
                            },
                        },
                    }),
                    signal: controller.signal,
                },
            );

            if (!response.ok) {
                throw new Error(`Gemini trả về HTTP ${response.status}.`);
            }

            const data = await response.json() as GeminiResponse;
            const candidate = data.candidates?.[0];
            const content = candidate?.content?.parts
                ?.map((part) => part.text || '')
                .join('')
                .trim();

            if (!content) {
                throw new Error('Gemini trả về dữ liệu không hợp lệ.');
            }

            if (candidate?.finishReason === 'MAX_TOKENS') {
                throw new Error('Gemini đã chạm giới hạn token trước khi hoàn tất câu trả lời.');
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

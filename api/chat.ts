import { GoogleGenAI } from '@google/genai';
import { ADVISOR_SYSTEM_PROMPT } from '../src/services/ai/systemPrompt.js';

type SafeMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type SafeContext = {
    culturalContext: string;
    guardContext: string;
};

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_LENGTH = 12_000;

const readMessages = (value: unknown): SafeMessage[] => {
    if (!Array.isArray(value)) return [];

    return value
        .slice(-MAX_MESSAGES)
        .flatMap((item): SafeMessage[] => {
            if (!item || typeof item !== 'object') return [];

            const { role, content } = item as { role?: unknown; content?: unknown };
            if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return [];

            const trimmedContent = content.trim().slice(0, MAX_MESSAGE_LENGTH);
            return trimmedContent ? [{ role, content: trimmedContent }] : [];
        });
};

const readContext = (value: unknown): SafeContext => {
    if (!value || typeof value !== 'object') {
        return { culturalContext: '', guardContext: '' };
    }

    const context = value as { culturalContext?: unknown; guardContext?: unknown };
    return {
        culturalContext: typeof context.culturalContext === 'string'
            ? context.culturalContext.trim().slice(0, MAX_CONTEXT_LENGTH)
            : '',
        guardContext: typeof context.guardContext === 'string'
            ? context.guardContext.trim().slice(0, MAX_CONTEXT_LENGTH)
            : '',
    };
};

export async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'JSON không hợp lệ.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        return Response.json({ error: 'Gemini chưa được cấu hình trên máy chủ.' }, { status: 503 });
    }

    const payload = body && typeof body === 'object'
        ? body as { messages?: unknown; context?: unknown }
        : {};
    const messages = readMessages(payload.messages);
    if (messages.length === 0 || !messages.some(({ role }) => role === 'user')) {
        return Response.json({ error: 'Nội dung hội thoại không hợp lệ.' }, { status: 400 });
    }

    const context = readContext(payload.context);
    const systemInstruction = [
        ADVISOR_SYSTEM_PROMPT,
        context.culturalContext,
        context.guardContext,
    ].filter(Boolean).join('\n\n');

    try {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: messages.map(({ role, content }) => ({
                role: role === 'assistant' ? 'model' : 'user',
                parts: [{ text: content }],
            })),
            config: {
                systemInstruction,
                temperature: 0.4,
                maxOutputTokens: 800,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const text = result.text?.trim();

        if (!text) {
            return Response.json({ error: 'Gemini không trả về nội dung hợp lệ.' }, { status: 502 });
        }

        return Response.json({ text, provider: 'gemini' });
    } catch {
        return Response.json({ error: 'Không thể nhận phản hồi từ Gemini.' }, { status: 502 });
    }
}

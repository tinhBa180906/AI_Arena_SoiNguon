import { checkCulturalRules } from '../../rules/culturalGuard';
import {
    findRelevantCulturalItems,
    formatCulturalContext,
    getFaqAnswer,
    normalizeVietnamese,
} from '../culturalSearch';
import { GeminiProvider } from './GeminiProvider';
import { OllamaProvider } from './OllamaProvider';
import { isLocalAIEnvironment } from './environment';
import { ADVISOR_SYSTEM_PROMPT } from './systemPrompt';
import type { AdvisorResult, ChatMessage } from './types';

const MAX_HISTORY_MESSAGES = 6;
const answerCache = new Map<string, string>();
const ollamaProvider = new OllamaProvider();
const geminiProvider = new GeminiProvider();

const stylingKeywords = [
    'phoi', 'remix', 'cach tan', 'streetwear', 'y2k', 'sneaker', 'boots', 'phu kien',
    'mac voi', 'di chua', 'di den', 'di dam', 'le tang', 'tot nghiep', 'club', 'bar',
];

const buildGuardContext = (question: string, garmentId?: string) => {
    const normalized = normalizeVietnamese(question);
    const isStylingQuestion = stylingKeywords.some((keyword) => normalized.includes(keyword));
    if (!isStylingQuestion || !garmentId) return '';

    let event = 'Dạo phố';
    if (normalized.includes('chua')) event = 'Đi Chùa';
    else if (normalized.includes('den')) event = 'Đi Đền';
    else if (normalized.includes('le tang') || normalized.includes('dam tang')) event = 'Lễ tang';
    else if (normalized.includes('tot nghiep')) event = 'Lễ tốt nghiệp';
    else if (normalized.includes('club')) event = 'Club';
    else if (normalized.includes('bar')) event = 'Bar';
    else if (normalized.includes('ca phe')) event = 'Cà phê';

    let style = 'Tối giản';
    if (normalized.includes('streetwear') || normalized.includes('sneaker')) style = 'Streetwear';
    else if (normalized.includes('y2k')) style = 'Y2K';

    let remixLevel = 50;
    if (normalized.includes('remix manh') || normalized.includes('cat xe')) remixLevel = 85;
    else if (normalized.includes('remix nhe') || normalized.includes('toi gian')) remixLevel = 30;

    const result = checkCulturalRules(event, garmentId, style, remixLevel);
    return [
        'CULTURAL GUARD:',
        `Mức: ${result.level.toUpperCase()}${result.block ? ' (không khuyến khích tiếp tục)' : ''}`,
        `Nhận định: ${result.message}`,
        result.suggestion ? `Gợi ý thay thế: ${result.suggestion}` : '',
    ].filter(Boolean).join('\n');
};

const buildContext = (question: string) => {
    const relevantItems = findRelevantCulturalItems(question);
    const culturalContext = relevantItems.length > 0
        ? `NGỮ CẢNH VĂN HÓA:\n${formatCulturalContext(relevantItems)}`
        : 'NGỮ CẢNH VĂN HÓA: Chưa tìm thấy dữ liệu liên quan trực tiếp trong culturalDb.';
    const guardContext = buildGuardContext(question, relevantItems[0]?.id);

    return { culturalContext, guardContext };
};

export const askAdvisor = async (question: string, history: ChatMessage[] = []): Promise<AdvisorResult> => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
        return {
            answer: 'Bạn hãy nhập một câu hỏi về Việt phục nhé.',
            providerStatus: null,
            source: 'unavailable',
            isError: true,
        };
    }

    const cacheKey = normalizeVietnamese(trimmedQuestion);
    const cachedAnswer = answerCache.get(cacheKey);
    if (cachedAnswer) {
        return { answer: cachedAnswer, providerStatus: null, source: 'cache' };
    }

    const faqAnswer = getFaqAnswer(trimmedQuestion);
    if (faqAnswer) {
        answerCache.set(cacheKey, faqAnswer);
        return { answer: faqAnswer, providerStatus: null, source: 'faq' };
    }

    const recentHistory = history
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .slice(-MAX_HISTORY_MESSAGES);
    const messages: ChatMessage[] = [
        { role: 'system', content: ADVISOR_SYSTEM_PROMPT },
        ...recentHistory,
        { role: 'user', content: trimmedQuestion },
    ];
    const context = buildContext(trimmedQuestion);
    const isLocal = isLocalAIEnvironment();

    if (isLocal) {
        try {
            const answer = await ollamaProvider.chat(messages, context);
            answerCache.set(cacheKey, answer);
            return { answer, providerStatus: 'local', source: 'ollama' };
        } catch {
            // Fall back to Gemini below.
        }
    }

    try {
        const answer = await geminiProvider.chat(messages, context);
        answerCache.set(cacheKey, answer);
        return { answer, providerStatus: 'cloud', source: 'gemini' };
    } catch {
        return {
            answer: isLocal
                ? 'Mình chưa kết nối được AI lúc này. Bạn hãy kiểm tra Ollama hoặc kết nối Gemini rồi thử lại nhé.'
                : 'Mình chưa kết nối được Gemini trên môi trường production. Bạn hãy kiểm tra cấu hình Gemini phía máy chủ trên Vercel rồi thử lại nhé.',
            providerStatus: 'offline',
            source: 'unavailable',
            isError: true,
        };
    }
};

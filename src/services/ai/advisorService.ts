import { checkCulturalRules } from '../../rules/culturalGuard';
import {
    findRelevantCulturalItems,
    formatCulturalContext,
    getFaqAnswer,
    normalizeVietnamese,
} from '../culturalSearch';
import { GeminiProvider } from './GeminiProvider';
import { OllamaProvider } from './OllamaProvider';
import type { AdvisorResult, ChatMessage } from './types';

const MAX_HISTORY_MESSAGES = 6;
const answerCache = new Map<string, string>();
const ollamaProvider = new OllamaProvider();
const geminiProvider = new GeminiProvider();

const SYSTEM_PROMPT = `Bạn là “Cố vấn Gen Z” của Sợi Nguồn, một stylist am hiểu Việt phục và văn hóa Việt Nam.

Nguyên tắc trả lời:
- Luôn trả lời trực tiếp câu hỏi hiện tại trước.
- Dùng lịch sử hội thoại để hiểu câu hỏi nối tiếp và các chi tiết người dùng đang nhắc tới.
- Không lặp lại điều người dùng vừa biết, trừ khi cần để giải thích hoặc tránh hiểu sai.
- Không lặp lại lời chào ở mỗi tin nhắn.
- Trả lời đủ ý, tự nhiên, không dừng giữa câu. Câu hỏi đơn giản nên trả lời trong 3-6 câu; câu hỏi cần giải thích nên dùng 1-3 đoạn ngắn.
- Trả lời bằng tiếng Việt thân thiện, trẻ trung nhưng không lố; không viết như đang đọc dữ liệu.
- Ưu tiên tuyệt đối dữ liệu từ NGỮ CẢNH VĂN HÓA và CULTURAL GUARD được cung cấp.
- Không bịa dữ kiện lịch sử hoặc khẳng định chắc chắn điều không có trong ngữ cảnh. Nếu dữ liệu chưa đủ, nói rõ giới hạn đó.

Với câu hỏi phối đồ:
- Không chỉ trả lời “được” hoặc “không được”.
- Nêu rõ có phù hợp không, phù hợp trong bối cảnh nào, vì sao và cách phối an toàn hơn.
- Chỉ rõ yếu tố truyền thống nên giữ và phần có thể remix khi ngữ cảnh văn hóa có đủ dữ liệu.
- Không tuyệt đối hóa. Một cách phối có thể không phù hợp với nghi lễ hoặc phục dựng nhưng vẫn dùng được trong concept thời trang sáng tạo nếu giữ các đặc trưng nhận diện chính.
- Nếu CULTURAL GUARD cảnh báo, giải thích cảnh báo bằng ngôn ngữ dễ hiểu và đề xuất một phương án thay thế cụ thể.

Nếu câu hỏi ngoài Việt phục hoặc văn hóa Việt Nam, trả lời ngắn rằng bạn chuyên về Việt phục và gợi ý người dùng hỏi chủ đề phù hợp.`;

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

    return [culturalContext, guardContext].filter(Boolean).join('\n\n');
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
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentHistory,
        { role: 'user', content: trimmedQuestion },
    ];
    const context = buildContext(trimmedQuestion);

    try {
        const answer = await ollamaProvider.chat(messages, context);
        answerCache.set(cacheKey, answer);
        return { answer, providerStatus: 'local', source: 'ollama' };
    } catch {
        if (geminiProvider.isConfigured) {
            try {
                const answer = await geminiProvider.chat(messages, context);
                answerCache.set(cacheKey, answer);
                return { answer, providerStatus: 'cloud', source: 'gemini' };
            } catch {
                // Return a friendly offline state below.
            }
        }
    }

    return {
        answer: 'Mình chưa kết nối được AI lúc này. Bạn hãy kiểm tra Ollama đang chạy; nếu muốn dùng dự phòng, hãy cấu hình Gemini API key rồi thử lại nhé.',
        providerStatus: 'offline',
        source: 'unavailable',
        isError: true,
    };
};

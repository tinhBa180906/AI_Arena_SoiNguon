import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Compass,
    LoaderCircle,
    MessageSquare,
    RotateCcw,
    Send,
    XCircle,
} from 'lucide-react';
import { quizQuestions, type QuizQuestion } from '../data/quizQuestions';
import { askAdvisor } from '../services/ai/advisorService';
import type { ChatMessage, ProviderStatus } from '../services/ai/types';

interface UiMessage extends ChatMessage {
    id: string;
    isError?: boolean;
}

interface ExploreProps {
    onExplore?: () => void;
}

const providerLabels: Record<ProviderStatus, string> = {
    local: 'LOCAL AI',
    cloud: 'CLOUD AI',
    offline: 'OFFLINE',
};

const providerStyles: Record<ProviderStatus, string> = {
    local: 'bg-luc text-giay-sang',
    cloud: 'bg-cham text-giay-sang',
    offline: 'bg-giay-sang text-son',
};

const shuffleQuestions = (questions: QuizQuestion[]) => {
    const shuffled = [...questions];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
};

export const Explore = ({ onExplore }: ExploreProps) => {
    const [messages, setMessages] = useState<UiMessage[]>([
        {
            id: 'welcome',
            content: 'Chào bạn! Mình là Cố vấn Gen Z của Sợi Nguồn. Bạn muốn hỏi gì về Việt Phục hay cách phối đồ hôm nay?',
            role: 'assistant',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [providerStatus, setProviderStatus] = useState<ProviderStatus>('offline');
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [xp, setXp] = useState(0);
    const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const progress = shuffledQuestions.length > 0
        ? ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100
        : 0;
    const percentage = shuffledQuestions.length > 0
        ? Math.round((score / shuffledQuestions.length) * 100)
        : 0;

    const resultMessage = percentage >= 80
        ? 'Bạn am hiểu Việt phục ghê đó!'
        : percentage >= 60
            ? 'Kiến thức khá tốt, thử thêm vài câu nữa nhé!'
            : 'Khởi đầu ổn rồi, khám phá thêm Việt phục nhé!';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        const question = input.trim();
        if (!question || isLoading) return;

        const history: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
        const userMessage: UiMessage = {
            id: `user-${Date.now()}`,
            content: question,
            role: 'user',
        };

        setInput('');
        setIsLoading(true);
        setMessages((current) => [...current, userMessage]);

        try {
            const result = await askAdvisor(question, history);
            if (result.providerStatus) setProviderStatus(result.providerStatus);
            setMessages((current) => [...current, {
                id: `assistant-${Date.now()}`,
                content: result.answer,
                role: 'assistant',
                isError: result.isError,
            }]);
        } catch {
            setProviderStatus('offline');
            setMessages((current) => [...current, {
                id: `error-${Date.now()}`,
                content: 'Có lỗi kết nối ngoài dự kiến. Bạn thử gửi lại sau một chút nhé.',
                role: 'assistant',
                isError: true,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = () => {
        setShuffledQuestions(shuffleQuestions(quizQuestions));
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setXp(0);
        setIsFinished(false);
        setIsStarted(true);
    };

    const selectAnswer = (answerIndex: number) => {
        if (selectedAnswer !== null || !currentQuestion) return;

        setSelectedAnswer(answerIndex);
        if (answerIndex === currentQuestion.correctAnswer) {
            setScore((current) => current + 1);
            setXp((current) => current + currentQuestion.xp);
        }
    };

    const goToNextQuestion = () => {
        if (selectedAnswer === null) return;

        if (currentQuestionIndex === shuffledQuestions.length - 1) {
            setIsFinished(true);
            return;
        }

        setCurrentQuestionIndex((current) => current + 1);
        setSelectedAnswer(null);
    };

    const exploreVietnameseDress = () => {
        setIsStarted(false);
        setIsFinished(false);
        onExplore?.();
    };

    return (
        <div className="w-full h-full bg-giay-do relative overflow-y-auto md:overflow-hidden flex flex-col md:flex-row p-4 lg:p-12 gap-6 lg:gap-8">
            {/* Cột trái: Chatbot Advisor */}
            <div className="flex-1 min-h-[520px] md:min-h-0 bg-giay-sang neo-border border-than flex flex-col overflow-hidden">
                <div className="bg-son text-giay-sang p-4 border-b-2 border-than flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl lg:text-2xl flex items-center gap-2"><MessageSquare /> Cố vấn Gen Z (AI)</h2>
                    <span className={`font-label text-[10px] px-2 py-1 rounded whitespace-nowrap ${providerStyles[providerStatus]}`}>
                        {providerLabels[providerStatus]}
                    </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4" aria-live="polite">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`max-w-[85%] p-4 neo-border ${
                                    message.role === 'user'
                                        ? 'bg-luc/20 ml-auto border-luc'
                                        : message.isError
                                            ? 'bg-son/10 border-son'
                                            : 'bg-giay-do border-than'
                                }`}
                            >
                                <p className="text-than text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div
                                key="thinking"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-[85%] p-4 neo-border bg-giay-do border-than flex items-center gap-2 text-than/70"
                            >
                                <LoaderCircle size={18} className="animate-spin" />
                                <span className="text-sm">Đang suy nghĩ...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t-2 border-than bg-giay-do flex gap-2 items-end">
                    <textarea
                        rows={1}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                void handleSend();
                            }
                        }}
                        placeholder="Hỏi AI về Việt Phục..."
                        disabled={isLoading}
                        className="flex-1 min-h-11 max-h-28 resize-y bg-giay-sang neo-border px-4 py-2 text-than focus:outline-none focus:border-son disabled:opacity-60"
                    />
                    <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={isLoading || !input.trim()}
                        aria-label="Gửi câu hỏi"
                        title="Gửi câu hỏi"
                        className="neo-button-primary w-12 h-11 p-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoaderCircle size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>

            {/* Cột phải: Quiz Mini-game */}
            <div className="flex-[0.8] min-h-[620px] md:min-h-0 flex flex-col gap-6 lg:gap-8 pb-24 md:pb-0">
                <div className="bg-cham/10 neo-border border-cham p-5 lg:p-7 flex flex-col items-center justify-center flex-1 min-h-0 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-cham/10 rotate-12"><Award size={150} /></div>

                    {!isStarted ? (
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <h2 className="font-display text-4xl text-than mb-4 relative z-10 text-center">Thử Thách<br />Kiến Thức</h2>
                            <p className="text-than/80 text-center mb-8 relative z-10 text-sm">Bạn đã sẵn sàng để kiểm tra kiến thức về cổ phục Việt Nam chưa?</p>
                            <p className="font-label text-[10px] text-cham mb-4">15 CÂU • 150 XP</p>
                            <button type="button" onClick={startQuiz} className="neo-button-primary bg-cham border-cham hover:bg-cham/90 w-full relative z-10">BẮT ĐẦU CHƠI</button>
                        </div>
                    ) : isFinished ? (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full h-full relative z-10 flex flex-col items-center justify-center text-center overflow-y-auto"
                        >
                            <Award size={56} className="text-nghe mb-4" aria-hidden="true" />
                            <p className="font-label text-xs text-cham mb-2">HOÀN THÀNH THỬ THÁCH</p>
                            <h2 className="font-display text-3xl lg:text-4xl text-than mb-5">Kết Quả Của Bạn</h2>
                            <div className="grid grid-cols-3 w-full border-y-2 border-than py-4 mb-5">
                                <div><strong className="font-display text-2xl text-son block">{score}/{shuffledQuestions.length}</strong><span className="text-[10px] font-label">CÂU ĐÚNG</span></div>
                                <div className="border-x-2 border-than"><strong className="font-display text-2xl text-son block">{xp}</strong><span className="text-[10px] font-label">XP</span></div>
                                <div><strong className="font-display text-2xl text-son block">{percentage}%</strong><span className="text-[10px] font-label">CHÍNH XÁC</span></div>
                            </div>
                            <p className="text-than font-semibold mb-6">{resultMessage}</p>
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button type="button" onClick={startQuiz} className="neo-button-primary flex-1 flex items-center justify-center gap-2">
                                    <RotateCcw size={18} aria-hidden="true" /> CHƠI LẠI
                                </button>
                                <button type="button" onClick={exploreVietnameseDress} className="neo-button-secondary flex-1 flex items-center justify-center gap-2">
                                    <Compass size={18} aria-hidden="true" /> KHÁM PHÁ VIỆT PHỤC
                                </button>
                            </div>
                        </motion.div>
                    ) : currentQuestion ? (
                        <div className="w-full h-full relative z-10 flex flex-col min-h-0">
                            <div className="shrink-0">
                                <h2 className="font-display text-2xl text-than mb-3">Thử Thách Kiến Thức</h2>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="font-label text-cham text-[10px]">CÂU {currentQuestionIndex + 1} / {shuffledQuestions.length}</span>
                                    <span className="font-label text-than/60 text-[9px]">{currentQuestion.category}</span>
                                </div>
                                <div className="h-3 border-2 border-than bg-giay-sang p-0.5 mb-5" role="progressbar" aria-label="Tiến độ câu hỏi" aria-valuemin={1} aria-valuemax={shuffledQuestions.length} aria-valuenow={currentQuestionIndex + 1}>
                                    <motion.div className="h-full bg-cham" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                                </div>
                            </div>

                            <div className="min-h-0 overflow-y-auto pr-1">
                                <h3 className="font-display text-xl lg:text-2xl text-than leading-tight mb-5">{currentQuestion.question}</h3>

                                <div className="flex flex-col gap-2.5">
                                    {currentQuestion.options.map((answer, index) => {
                                        const isCorrect = index === currentQuestion.correctAnswer;
                                        const isSelected = index === selectedAnswer;
                                        const answerRevealed = selectedAnswer !== null;
                                        const stateClass = !answerRevealed
                                            ? 'bg-giay-sang hover:bg-giay-do hover:-translate-y-0.5'
                                            : isCorrect
                                                ? 'bg-luc text-giay-sang border-luc'
                                                : isSelected
                                                    ? 'bg-son text-giay-sang border-son'
                                                    : 'bg-giay-sang text-than/50 opacity-70';

                                        return (
                                            <button
                                                type="button"
                                                key={answer}
                                                onClick={() => selectAnswer(index)}
                                                disabled={answerRevealed}
                                                aria-pressed={isSelected}
                                                className={`w-full min-h-12 p-3 text-left neo-border rounded-[4px] shadow-[3px_3px_0_var(--than)] transition-all flex items-center gap-3 disabled:cursor-default ${stateClass}`}
                                            >
                                                <span className="font-label text-xs shrink-0">{String.fromCharCode(65 + index)}.</span>
                                                <span className="text-sm flex-1">{answer}</span>
                                                {answerRevealed && isCorrect && <><CheckCircle2 size={18} aria-hidden="true" /><span className="sr-only">Đáp án đúng</span></>}
                                                {answerRevealed && isSelected && !isCorrect && <><XCircle size={18} aria-hidden="true" /><span className="sr-only">Đáp án đã chọn chưa đúng</span></>}
                                            </button>
                                        );
                                    })}
                                </div>

                                <AnimatePresence>
                                    {selectedAnswer !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            role="status"
                                            className={`mt-5 p-4 border-l-4 bg-giay-sang ${selectedAnswer === currentQuestion.correctAnswer ? 'border-luc' : 'border-son'}`}
                                        >
                                            <div className={`font-bold flex items-center gap-2 mb-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-luc' : 'text-son'}`}>
                                                {selectedAnswer === currentQuestion.correctAnswer
                                                    ? <><CheckCircle2 size={20} aria-hidden="true" /> Chính xác!</>
                                                    : <><XCircle size={20} aria-hidden="true" /> Chưa đúng.</>}
                                            </div>
                                            {selectedAnswer !== currentQuestion.correctAnswer && (
                                                <p className="text-sm font-semibold text-than mb-1">Đáp án đúng: {currentQuestion.options[currentQuestion.correctAnswer]}.</p>
                                            )}
                                            <p className="text-sm text-than/80 leading-relaxed">{currentQuestion.explanation}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {selectedAnswer !== null && (
                                    <button type="button" onClick={goToNextQuestion} className="neo-button-primary w-full mt-5 flex items-center justify-center gap-2">
                                        {currentQuestionIndex === shuffledQuestions.length - 1 ? 'XEM KẾT QUẢ' : 'CÂU TIẾP THEO'}
                                        <ArrowRight size={18} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="bg-giay-sang neo-border p-6 flex items-center justify-between">
                    <div>
                        <span className="font-label text-[10px] text-than/60 block mb-1">ĐIỂM TÍCH LŨY</span>
                        <motion.span
                            key={xp}
                            initial={{ scale: 1.18, color: 'var(--luc)' }}
                            animate={{ scale: 1, color: 'var(--son)' }}
                            className="font-display text-4xl inline-block"
                        >
                            {xp} <span className="text-xl">XP</span>
                        </motion.span>
                    </div>
                    <Award size={48} className="text-nghe" />
                </div>
            </div>
        </div>
    );
};

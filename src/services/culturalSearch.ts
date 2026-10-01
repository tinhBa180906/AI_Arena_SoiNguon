import { culturalDb, type CulturalItem } from '../data/culturalDb';

const aliases: Record<string, string[]> = {
    ao_dai: ['ao dai', 'áo dài'],
    ao_tu_than: ['ao tu than', 'áo tứ thân', 'tu than', 'tứ thân'],
    ao_ngu_than: ['ao ngu than', 'áo ngũ thân', 'ngu than', 'ngũ thân', 'lap linh', 'lập lĩnh'],
    ao_nhat_binh: ['ao nhat binh', 'áo nhật bình', 'nhat binh', 'nhật bình'],
    ao_ba_ba: ['ao ba ba', 'áo bà ba', 'ba ba', 'bà ba'],
};

export const normalizeVietnamese = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizedAliases = Object.fromEntries(
    Object.entries(aliases).map(([id, values]) => [id, values.map(normalizeVietnamese)]),
);

export const findRelevantCulturalItems = (question: string, limit = 2): CulturalItem[] => {
    const normalizedQuestion = normalizeVietnamese(question);
    const questionTokens = new Set(normalizedQuestion.split(' ').filter((token) => token.length > 2));

    return Object.values(culturalDb)
        .map((item) => {
            const itemAliases = normalizedAliases[item.id] || [normalizeVietnamese(item.name)];
            const aliasScore = itemAliases.some((alias) => normalizedQuestion.includes(alias)) ? 10 : 0;
            const searchable = normalizeVietnamese([
                item.name,
                item.region,
                item.era,
                item.description,
                ...item.suitableFor,
                ...item.unsuitableFor,
                ...item.pairedWith,
            ].join(' '));
            const tokenScore = [...questionTokens].filter((token) => searchable.includes(token)).length;
            return { item, score: aliasScore + tokenScore };
        })
        .filter(({ score }) => score >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ item }) => item);
};

export const formatCulturalContext = (items: CulturalItem[]) => items.map((item) => [
    `Trang phục: ${item.name}`,
    `Khu vực/thời kỳ: ${item.region}; ${item.era}`,
    `Mô tả: ${item.description}`,
    `Phù hợp: ${item.suitableFor.join(', ')}`,
    `Không phù hợp: ${item.unsuitableFor.join(', ')}`,
    `Phối cùng: ${item.pairedWith.join(', ')}`,
    `Nguyên tắc cần giữ: ${item.keepRule}`,
    `Gợi ý sáng tạo: ${item.tweakRule}`,
    `Nguồn: ${item.sources.join(', ')}`,
].join('\n')).join('\n\n');

export const getFaqAnswer = (question: string): string | null => {
    const normalizedQuestion = normalizeVietnamese(question);
    const matchedEntry = Object.entries(normalizedAliases).find(([, itemAliases]) =>
        itemAliases.some((alias) =>
            normalizedQuestion === `${alias} la gi`
            || normalizedQuestion === alias
            || normalizedQuestion === `${alias} co nghia la gi`,
        ),
    );

    if (!matchedEntry) return null;

    const item = culturalDb[matchedEntry[0]];
    return `${item.name} là trang phục có nguồn gốc/phổ biến tại ${item.region}, gắn với ${item.era}. ${item.description} Khi phối hiện đại, ${item.keepRule.toLowerCase()} Nguồn tham khảo: ${item.sources.join(', ')}.`;
};

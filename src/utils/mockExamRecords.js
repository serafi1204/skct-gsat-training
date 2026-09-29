import { OMR_SECTION_COUNT, OMR_SECTION_SIZE, OMR_TOTAL, normalizeOmrText, parseOmrText } from './omrText.js';

export const MOCK_EXAM_SECTIONS = ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'];

export function validateMockExamInput({ name, date, answers, correct }) {
    if (typeof name !== 'string' || !name.trim()) return '기록 이름을 입력해 주세요.';
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || Number.isNaN(new Date(`${date}T00:00:00`).getTime())
        || new Date(`${date}T00:00:00`).getFullYear() !== Number(date.slice(0, 4))
        || new Date(`${date}T00:00:00`).getMonth() + 1 !== Number(date.slice(5, 7))
        || new Date(`${date}T00:00:00`).getDate() !== Number(date.slice(8, 10))) {
        return '올바른 날짜를 입력해 주세요.';
    }
    if (typeof answers !== 'string' || typeof correct !== 'string') return '답안 TXT를 입력해 주세요.';
    if (parseOmrText(correct).some(choice => choice === null)) return '정답 TXT에 100문항의 정답(1~5)을 모두 입력해 주세요.';
    return '';
}

export function normalizeMockExamRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const value = {
        id: typeof record.id === 'string' ? record.id : '',
        name: typeof record.name === 'string' ? record.name.trim() : '',
        date: typeof record.date === 'string' ? record.date : '',
        answers: normalizeOmrText(typeof record.answers === 'string' ? record.answers : ''),
        correct: normalizeOmrText(typeof record.correct === 'string' ? record.correct : ''),
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    };
    return value.id && !validateMockExamInput(value) ? value : null;
}

export function scoreMockExam(record) {
    const answers = parseOmrText(record.answers);
    const correct = parseOmrText(record.correct);
    const sections = Array.from({ length: OMR_SECTION_COUNT }, (_, section) => {
        const result = { attempted: 0, correct: 0, wrong: 0, unanswered: 0 };
        for (let offset = 0; offset < OMR_SECTION_SIZE; offset += 1) {
            const index = section * OMR_SECTION_SIZE + offset;
            if (answers[index] === null) result.unanswered += 1;
            else {
                result.attempted += 1;
                if (answers[index] === correct[index]) result.correct += 1;
                else result.wrong += 1;
            }
        }
        return result;
    });
    const total = sections.reduce((sum, section) => ({
        attempted: sum.attempted + section.attempted,
        correct: sum.correct + section.correct,
        wrong: sum.wrong + section.wrong,
        unanswered: sum.unanswered + section.unanswered,
    }), { attempted: 0, correct: 0, wrong: 0, unanswered: 0 });
    return { sections, total, score: total.correct, accuracy: total.attempted
        ? Math.round(total.correct / total.attempted * 100) : null, maximum: OMR_TOTAL };
}

export function analyzeMockExams(records) {
    const sorted = records.map(record => ({ ...record, result: scoreMockExam(record) }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    const latest = sorted.at(-1) ?? null;
    const previous = sorted.at(-2) ?? null;
    const recent = sorted.slice(-3);
    const earlier = sorted.length >= 6 ? sorted.slice(-6, -3) : [];
    const mean = items => items.length ? Math.round(items.reduce((sum, item) => sum + item.result.score, 0) / items.length * 10) / 10 : null;
    const sectionMean = (index, key) => recent.length
        ? Math.round(recent.reduce((sum, record) => sum + record.result.sections[index][key], 0) / recent.length * 10) / 10
        : null;
    const sectionAverages = MOCK_EXAM_SECTIONS.map((name, index) => {
        const wrong = sectionMean(index, 'wrong');
        const unanswered = sectionMean(index, 'unanswered');
        return { name,
            score: sectionMean(index, 'correct'),
            attempted: sectionMean(index, 'attempted'),
            wrong, unanswered,
            cause: wrong === 0 && unanswered === 0 ? '오답·미풀이 없음'
                : unanswered > wrong ? '미풀이가 더 많음' : wrong > unanswered ? '오답이 더 많음' : '오답과 미풀이가 비슷함',
        };
    });
    const lowestScore = recent.length ? Math.min(...sectionAverages.map(section => section.score)) : null;
    const weakestSections = recent.length ? sectionAverages.filter(section => section.score === lowestScore) : [];
    return {
        sorted, latest, previous, recentAverage: mean(recent), earlierAverage: mean(earlier),
        recentCount: recent.length, weakestSections,
        sectionAverages, weakest: weakestSections[0] ?? null,
    };
}

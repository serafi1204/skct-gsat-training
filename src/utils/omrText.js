export const OMR_SECTION_SIZE = 20;
export const OMR_SECTION_COUNT = 5;
export const OMR_TOTAL = OMR_SECTION_SIZE * OMR_SECTION_COUNT;

export function normalizeOmrText(value) {
    const sections = [];
    for (const line of value.replace(/\r/g, '').split('\n')) {
        const digits = line.replace(/[^0-5]/g, '');
        if (!digits) {
            sections.push('');
            if (sections.length >= OMR_SECTION_COUNT) break;
            continue;
        }
        for (let index = 0; index < digits.length; index += OMR_SECTION_SIZE) {
            sections.push(digits.slice(index, index + OMR_SECTION_SIZE));
            if (sections.length >= OMR_SECTION_COUNT) break;
        }
        if (sections.length >= OMR_SECTION_COUNT) break;
    }
    return sections.join('\n');
}

export function parseOmrText(value) {
    const answers = Array(OMR_TOTAL).fill(null);
    normalizeOmrText(value).split('\n').forEach((line, section) => {
        for (let index = 0; index < line.length; index += 1) {
            const choice = Number(line[index]);
            answers[section * OMR_SECTION_SIZE + index] = choice || null;
        }
    });
    return answers;
}

export function formatOmrText(answers) {
    const lastMarked = answers.reduce((last, answer, index) => answer ? index : last, -1);
    if (lastMarked < 0) return '';
    const digits = Array.from({ length: lastMarked + 1 }, (_, index) => answers[index] || 0).join('');
    return digits.match(/.{1,20}/g).join('\n');
}

export function summarizeOmrAnswers(answers, correctAnswers) {
    const sections = Array.from({ length: OMR_SECTION_COUNT }, (_, section) => {
        const counts = { solved: 0, correct: 0, incorrect: 0 };
        for (let offset = 0; offset < OMR_SECTION_SIZE; offset += 1) {
            const index = section * OMR_SECTION_SIZE + offset;
            if (!answers[index]) continue;
            counts.solved += 1;
            if (!correctAnswers[index]) continue;
            if (answers[index] === correctAnswers[index]) counts.correct += 1;
            else counts.incorrect += 1;
        }
        return counts;
    });
    const total = sections.reduce((sum, counts) => ({
        solved: sum.solved + counts.solved,
        correct: sum.correct + counts.correct,
        incorrect: sum.incorrect + counts.incorrect,
    }), { solved: 0, correct: 0, incorrect: 0 });
    return { sections, total };
}

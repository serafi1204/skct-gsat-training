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

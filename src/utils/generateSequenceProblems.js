const int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[int(0, items.length - 1)];
const nonzero = (min, max) => pick(Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(Boolean));
const signed = (n) => n < 0 ? `−${Math.abs(n)}` : `+${n}`;
const progression = (start, step, length, multiply = false) =>
    Array.from({ length }, (_, i) => multiply ? start * step ** i : start + step * i);
const recurrence = (start, length, next) => {
    const values = [start];
    while (values.length < length) values.push(next(values.at(-1), values.length - 1));
    return values;
};

export const SEQUENCE_TYPES = [
    { id: 'arithmetic', label: '등차' },
    { id: 'geometric', label: '등비' },
    { id: 'arithmeticDifference', label: '등차형 계차' },
    { id: 'geometricDifference', label: '등비형 계차' },
    { id: 'interleaved', label: '홀짝 분리' },
    { id: 'alternating', label: '연산 교대' },
    { id: 'affine', label: '복합 연산' },
    { id: 'fibonacci', label: '피보나치형' },
    { id: 'grouped', label: '군수열' },
];

function candidate(type) {
    switch (type) {
        case 'arithmetic': {
            const d = nonzero(-15, 15);
            return { values: progression(int(1, 100), d, 6), explanation: `앞 항에 매번 ${signed(d)}를 적용합니다.` };
        }
        case 'geometric': {
            const r = int(2, 3);
            const reverse = Math.random() < 0.5;
            const values = progression(int(1, 8), r, 6, true);
            if (reverse) values.reverse();
            return { values, explanation: `앞 항에 매번 ${reverse ? '÷' : '×'}${r}을 적용합니다.` };
        }
        case 'arithmeticDifference': {
            const d = int(2, 12), change = nonzero(-3, 5);
            const differences = progression(d, change, 5);
            return {
                values: recurrence(int(1, 50), 6, (v, i) => v + differences[i]),
                explanation: `인접한 항의 차이는 ${differences.join(', ')}입니다. 차이가 매번 ${signed(change)}만큼 변합니다.`,
            };
        }
        case 'geometricDifference': {
            const d = int(1, 4), r = int(2, 3);
            const differences = progression(d, r, 5, true);
            return {
                values: recurrence(int(1, 30), 6, (v, i) => v + differences[i]),
                explanation: `인접한 항의 차이는 ${differences.join(', ')}입니다. 차이가 매번 ${r}배가 됩니다.`,
            };
        }
        case 'interleaved': {
            const branch = () => {
                const multiply = Math.random() < 0.5;
                const step = multiply ? int(2, 3) : nonzero(-10, 10);
                return { values: progression(multiply ? int(1, 6) : int(1, 80), step, 4, multiply), rule: multiply ? `×${step}` : signed(step) };
            };
            const odd = branch(), even = branch();
            if (odd.values.every((v, i) => v === even.values[i])) return null;
            return {
                values: odd.values.flatMap((v, i) => [v, even.values[i]]),
                explanation: `홀수 위치: ${odd.values.join(', ')} (${odd.rule}). 짝수 위치: ${even.values.join(', ')} (${even.rule}).`,
            };
        }
        case 'alternating': {
            if (Math.random() < 0.5) {
                const p = int(2, 12), q = int(2, 12);
                if (p === q) return null;
                return { values: recurrence(int(10, 60), 8, (v, i) => v + (i % 2 === 0 ? p : -q)), explanation: `+${p}, −${q}를 번갈아 적용합니다.` };
            }
            const r = int(2, 3), d = nonzero(-5, 8);
            return { values: recurrence(int(1, 10), 8, (v, i) => i % 2 === 0 ? v * r : v + d), explanation: `×${r}, ${signed(d)}를 번갈아 적용합니다.` };
        }
        case 'affine': {
            const r = int(2, 3), d = nonzero(-5, 5);
            return { values: recurrence(int(1, 8), 6, (v) => v * r + d), explanation: `앞 항에 ${r}을 곱한 뒤 ${signed(d)}를 적용합니다.` };
        }
        case 'fibonacci': {
            const values = [int(1, 12), int(2, 20)];
            while (values.length < 6) values.push(values.at(-1) + values.at(-2));
            return { values, explanation: `앞의 두 항을 더합니다. 마지막 항은 ${values[3]} + ${values[4]} = ${values[5]}입니다.` };
        }
        case 'grouped': {
            const multiply = Math.random() < 0.5;
            const groups = Array.from({ length: 3 }, () => {
                const x = int(multiply ? 2 : 1, multiply ? 12 : 40);
                const y = int(multiply ? 2 : 1, multiply ? 12 : 40);
                return [x, y, multiply ? x * y : x + y];
            });
            // Avoid examples where sum and product happen to coincide.
            if (multiply && groups.slice(0, 2).every(([x, y]) => x + y === x * y)) return null;
            return { values: groups.flat(), explanation: `세 항씩 묶습니다: ${groups.map(g => `(${g.join(', ')})`).join(' / ')}. 각 묶음에서 첫째 ${multiply ? '×' : '+'} 둘째 = 셋째입니다.` };
        }
        default: throw new Error(`Unknown sequence type: ${type}`);
    }
}

// Reject collapsed sequences and common simple rules with competing answers.
function isValid(values, maxValue = 999) {
    if (!values.every(v => Number.isInteger(v) && v >= 1 && v <= maxValue)) return false;
    if (new Set(values).size < 3) return false;
    const shown = values.slice(0, -1), answer = values.at(-1);
    const d = shown[1] - shown[0], r = shown[1] / shown[0];
    if (shown.every((v, i) => v === shown[0] + d * i) && answer !== shown.at(-1) + d) return false;
    if (shown.every((v, i) => v === shown[0] * r ** i) && answer !== shown.at(-1) * r) return false;
    return true;
}

export function generateSequenceProblems(count, { maxValue = 999 } = {}) {
    if (!Number.isInteger(count) || count < 1 || count > 100) throw new RangeError('문제 수는 1~100이어야 합니다.');
    const seen = new Set();
    return Array.from({ length: count }, () => {
        // Pick once so rejection sampling does not change the type distribution.
        const type = pick(SEQUENCE_TYPES);
        for (let attempt = 0; attempt < 10000; attempt++) {
            const problem = candidate(type.id);
            if (!problem || !isValid(problem.values, maxValue)) continue;
            const key = problem.values.slice(0, -1).join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            return { ...problem, type: type.id, label: type.label, answer: String(problem.values.at(-1)) };
        }
        throw new Error('문제를 생성하지 못했습니다. 다시 시작해 주세요.');
    });
}

// Canonical answers are stored as integers or reduced fractions; never reduce user input.
export const isSequenceAnswerCorrect = (input, answer) => String(input).trim() === String(answer);

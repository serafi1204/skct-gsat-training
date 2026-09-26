const int = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
export const CALCULATION_TYPES = ['average', 'sum', 'growth', 'share'];

const fourValues = (min, max) => Array.from({ length: 4 }, () => int(min, max));

// The false claim is within 5% of the exact value but differs at displayed precision.
function proposedValue(exact, decimals) {
    const rounded = Number(exact.toFixed(decimals));
    if (Math.random() < 0.5) return { value: rounded, answer: 'O' };
    const unit = 10 ** decimals;
    const maximum = Math.max(1, Math.floor(exact * 0.05 * unit));
    for (let attempt = 0; attempt < 100; attempt++) {
        const offset = int(1, maximum) * (Math.random() < 0.5 ? -1 : 1) / unit;
        const value = Number((rounded + offset).toFixed(decimals));
        const deviation = Math.abs(value - exact) / exact;
        if (value > 0 && value !== rounded && deviation <= 0.05) return { value, answer: 'X' };
    }
    // Very small ratios can be too close to zero at two decimal places.
    return { value: rounded, answer: 'O' };
}

function growthProblem(min, max) {
    for (let attempt = 0; attempt < 1000; attempt++) {
        const rate = int(100, Math.min(8000, Math.floor((max / min - 1.02) * 10000))) / 10000;
        // Aim inside the allowed interval so rounding the displayed numbers
        // cannot make the two growth rates appear less than 0.5%p apart.
        const gap = int(60, 90) / 10000;
        const bases = [int(min, Math.floor(max / (1 + rate))), int(min, Math.floor(max / (1 + rate + gap)))];
        const pairs = bases.map((base, i) => [base, Math.round(base * (1 + rate + i * gap))]);
        const growthRates = pairs.map(([before, after]) => (after - before) / before * 100);
        const actualGap = Math.abs(growthRates[1] - growthRates[0]);
        const displayedRates = growthRates.map(value => Number(value.toFixed(2)));
        const displayedGap = Math.abs(displayedRates[1] - displayedRates[0]);
        if (actualGap < 0.55 || actualGap > 1 || displayedGap < 0.5
            || pairs.flat().some(v => v < min || v > max)) continue;
        if (Math.random() < 0.5) { pairs.reverse(); growthRates.reverse(); }
        const winner = growthRates[0] > growthRates[1] ? 1 : 2;
        const claim = int(1, 2);
        return {
            type: 'growth', scoring: 'ox', label: '증가율 비교', values: pairs.flat(), pairs,
            growthRates, answer: claim === winner ? 'O' : 'X', claim,
            prompt: `${pairs.map(([before, after], i) => `${i + 1}. ${before} → ${after}`).join('\n')}\n${claim}번의 증가율이 더 크다.`,
            explanation: `${pairs.map(([before, after], i) => `${i + 1}번: (${after} − ${before}) ÷ ${before} × 100 ≈ ${growthRates[i].toFixed(4)}%`).join(' / ')}. ${winner}번이 더 큽니다.`,
        };
    }
    throw new Error('증가율 문제를 생성하지 못했습니다. 다시 시작해 주세요.');
}

function averageProblem(min, max) {
    const values = fourValues(min, max);
    const exact = values.reduce((a, b) => a + b, 0) / 4;
    const { value, answer } = proposedValue(exact, 2);
    return {
        type: 'average', scoring: 'ox', label: '평균 판단', values, answer, proposed: value, exact,
        prompt: `${values.join(', ')}\n이 네 수의 평균은 ${value.toFixed(2)}이다.`,
        explanation: `(${values.join(' + ')}) ÷ 4 = ${exact.toFixed(2)}. 제시값 ${value.toFixed(2)}와 비교합니다.`,
    };
}

function sumProblem(min, max) {
    const values = fourValues(min, max);
    const answer = String(values.reduce((sum, value) => sum + value, 0));
    return {
        type: 'sum', scoring: 'errorRate', label: '합 계산', values, answer,
        prompt: `${values.join(' + ')} = ?`,
        explanation: `${values.join(' + ')} = ${answer}`,
    };
}

function shareProblem(min, max) {
    const values = fourValues(min, max);
    const targetIndex = int(0, 3);
    const total = values.reduce((sum, value) => sum + value, 0);
    const exact = values[targetIndex] / total * 100;
    const { value, answer } = proposedValue(exact, 2);
    return {
        type: 'share', scoring: 'ox', label: '전체 대비 비율 판단', values, targetIndex, answer, proposed: value, exact,
        prompt: `${values.map((v, i) => `${i + 1}. ${v}${i === targetIndex ? ' ← 대상' : ''}`).join('\n')}\n대상의 전체 대비 비율은 ${value.toFixed(2)}%이다.`,
        explanation: `${values[targetIndex]} ÷ ${total} × 100 = ${exact.toFixed(2)}% (소수 둘째 자리 반올림). 제시값 ${value.toFixed(2)}%와 비교합니다.`,
    };
}

const generators = { average: averageProblem, sum: sumProblem, growth: growthProblem, share: shareProblem };

export function generateAdditionProblems(count, { min = 100, max = 9999 } = {}) {
    if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new RangeError('문제 수는 1~100이어야 합니다.');
    }
    return Array.from({ length: count }, () => generators[CALCULATION_TYPES[int(0, 3)]](min, max));
}

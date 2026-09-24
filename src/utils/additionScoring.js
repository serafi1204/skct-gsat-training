export function additionErrorRate(input, answer) {
    const text = String(input).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
    const value = Number(text), target = Number(answer);
    if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return null;
    const rate = Math.abs((value - target) / target) * 100;
    return Number.isFinite(rate) ? rate : null;
}

export function summarizeAddition(results) {
    const calculations = results.filter(r => r.problem?.scoring !== 'choice');
    const comparisons = results.filter(r => r.problem?.scoring === 'choice');
    const valid = calculations.filter(r => Number.isFinite(r.errorRate));
    const comparisonCorrect = comparisons.filter(r => r.correct).length;
    return {
        averageErrorRate: valid.length ? valid.reduce((sum, r) => sum + r.errorRate / valid.length, 0) : null,
        validCount: valid.length,
        invalidCount: calculations.length - valid.length,
        calculationCount: calculations.length,
        comparisonCount: comparisons.length,
        comparisonCorrect,
        comparisonAccuracy: comparisons.length ? comparisonCorrect / comparisons.length * 100 : null,
        byType: ['average', 'sum', 'share'].map(type => {
            const items = calculations.filter(r => r.problem?.type === type);
            const scored = items.filter(r => Number.isFinite(r.errorRate));
            return { type, count: items.length, validCount: scored.length, averageErrorRate: scored.length ? scored.reduce((sum, r) => sum + r.errorRate / scored.length, 0) : null };
        }),
        totalCount: results.length,
    };
}

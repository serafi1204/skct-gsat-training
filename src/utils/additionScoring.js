export function additionErrorRate(input, answer) {
    const text = String(input).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
    const value = Number(text), target = Number(answer);
    if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return null;
    const rate = Math.abs((value - target) / target) * 100;
    return Number.isFinite(rate) ? rate : null;
}

export function scoreAdditionAnswer(problem, input) {
    if (problem.scoring === 'ox') return { correct: input === problem.answer };
    return { errorRate: additionErrorRate(input, problem.answer) };
}

export function summarizeAddition(results) {
    const sumResults = results.filter(r => r.problem.type === 'sum');
    const validSums = sumResults.filter(r => Number.isFinite(r.errorRate));
    const byType = ['average', 'sum', 'growth', 'share'].map(type => {
        const items = results.filter(r => r.problem.type === type);
        if (type === 'sum') return {
            type, count: items.length, validCount: validSums.length,
            averageErrorRate: validSums.length ? validSums.reduce((sum, r) => sum + r.errorRate, 0) / validSums.length : null,
        };
        const correctCount = items.filter(r => r.correct).length;
        return { type, count: items.length, correctCount, accuracy: items.length ? correctCount / items.length * 100 : null };
    });
    return {
        byType,
        averageErrorRate: byType.find(item => item.type === 'sum').averageErrorRate,
        validCount: validSums.length,
        invalidCount: sumResults.length - validSums.length,
        calculationCount: sumResults.length,
        totalCount: results.length,
    };
}

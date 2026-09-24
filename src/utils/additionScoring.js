export function additionErrorRate(input, answer) {
    const text = String(input).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
    const value = Number(text), target = Number(answer);
    if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return null;
    const rate = Math.abs((value - target) / target) * 100;
    return Number.isFinite(rate) ? rate : null;
}

export function summarizeAddition(results) {
    const valid = results.filter(r => Number.isFinite(r.errorRate));
    return {
        averageErrorRate: valid.length ? valid.reduce((sum, r) => sum + r.errorRate / valid.length, 0) : null,
        validCount: valid.length,
        invalidCount: results.length - valid.length,
        totalCount: results.length,
    };
}

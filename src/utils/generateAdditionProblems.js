export function generateAdditionProblems(count) {
    if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new RangeError('문제 수는 1~100이어야 합니다.');
    }
    return Array.from({ length: count }, () => {
        const values = Array.from({ length: 4 }, () => 100 + Math.floor(Math.random() * 9900));
        const answer = String(values.reduce((sum, value) => sum + value, 0));
        return {
            values,
            answer,
            label: '네 수 더하기',
            prompt: `${values.join(' + ')} = ?`,
            explanation: `${values.join(' + ')} = ${answer}`,
        };
    });
}

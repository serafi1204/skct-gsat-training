const int = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
export const CALCULATION_TYPES = ['average', 'sum', 'growth', 'share'];

function growthProblem() {
    for (let attempt = 0; attempt < 1000; attempt++) {
        const rate = int(100, 8000) / 10000;
        const gap = int(50, 100) / 10000;
        const bases = [int(100, Math.floor(9999 / (1 + rate))), int(100, Math.floor(9999 / (1 + rate + gap)))];
        const pairs = bases.map((base, i) => [base, Math.round(base * (1 + rate + i * gap))]);
        const growth = pairs.map(([before, after]) => (after - before) / before * 100);
        const actualGap = Math.abs(growth[1] - growth[0]);
        if (actualGap < 0.5 || actualGap > 1 || pairs.flat().some(v => v < 100 || v > 9999)) continue;
        if (Math.random() < 0.5) { pairs.reverse(); growth.reverse(); }
        const answer = growth[0] > growth[1] ? '1' : '2';
        return {
            type: 'growth', scoring: 'choice', label: '증가율 비교', values: pairs.flat(), pairs,
            answer, growthRates: growth,
            prompt: pairs.map(([before, after], i) => `${i + 1}. ${before} → ${after}`).join('\n'),
            instruction: '변화 전 → 변화 후의 두 묶음 중 증가율이 더 큰 번호(1 또는 2)를 입력하세요.',
            explanation: pairs.map(([before, after], i) => `${i + 1}번: (${after} − ${before}) ÷ ${before} × 100 ≈ ${growth[i].toFixed(4)}%`).join(' / ') + ` → ${answer}번이 더 큽니다.`,
        };
    }
    throw new Error('증가율 문제를 생성하지 못했습니다. 다시 시작해 주세요.');
}

export function generateAdditionProblems(count) {
    if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new RangeError('문제 수는 1~100이어야 합니다.');
    }
    return Array.from({ length: count }, () => {
        const type = CALCULATION_TYPES[int(0, 3)];
        if (type === 'growth') return growthProblem();
        const values = Array.from({ length: 4 }, () => int(100, 9999));
        const total = values.reduce((sum, value) => sum + value, 0);
        const targetIndex = int(0, 3);
        const answer = type === 'average' ? total / 4 : type === 'share' ? values[targetIndex] / total * 100 : total;
        const labels = { average: '평균', sum: '합', share: '전체 대비 비율' };
        const instructions = {
            average: '네 수의 평균을 입력하세요. 소수 입력이 가능합니다.',
            sum: '네 수의 합을 입력하세요. (콤마 제외)',
            share: `네 수의 합계 중 ${targetIndex + 1}번 숫자가 차지하는 비율을 % 단위로 입력하세요. 예: 25.5 (% 기호 제외)`,
        };
        return {
            type, scoring: 'errorRate', values, answer: String(answer),
            displayAnswer: type === 'share' ? `${answer.toFixed(4)}% (근삿값)` : String(answer),
            targetIndex: type === 'share' ? targetIndex : undefined,
            label: labels[type], instruction: instructions[type],
            prompt: type === 'share' ? values.map((v, i) => `${i + 1}. ${v}${i === targetIndex ? ' ← 비율을 구할 숫자' : ''}`).join('\n') : values.join(' + ') + (type === 'average' ? ' → 평균 ?' : ' = ?'),
            explanation: type === 'average' ? `합계 ${total} ÷ 4 = ${answer}` : type === 'share' ? `${values[targetIndex]} ÷ ${total} × 100 ≈ ${answer.toFixed(4)}%. 오차율은 반올림 전 값을 기준으로 계산합니다.` : `${values.join(' + ')} = ${answer}`,
        };
    });
}

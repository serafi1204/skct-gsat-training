import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateAdditionProblems } from './generateAdditionProblems.js';
import { additionErrorRate, summarizeAddition } from './additionScoring.js';

test('four random calculation types respect bounds and independently computed answers', () => {
    const original = Math.random;
    let seed = 20260924;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const counts = { average: 0, sum: 0, growth: 0, share: 0 };
    const winners = new Set();
    try {
        for (let batch = 0; batch < 100; batch++) {
            for (const p of generateAdditionProblems(30)) {
                counts[p.type]++;
                assert.equal(p.values.length, 4);
                assert.ok(p.values.every(v => Number.isInteger(v) && v >= 100 && v <= 9999));
                const sum = p.values.reduce((a, b) => a + b, 0);
                if (p.type === 'growth') {
                    const rates = p.pairs.map(([a, b]) => (b - a) / a * 100);
                    const gap = Math.abs(rates[0] - rates[1]);
                    assert.ok(gap >= 0.5 && gap <= 1);
                    assert.ok(rates.every(r => r > 0));
                    assert.equal(p.answer, rates[0] > rates[1] ? '1' : '2');
                    winners.add(p.answer);
                } else {
                    const expected = p.type === 'sum' ? sum : p.type === 'average' ? sum / 4 : p.values[p.targetIndex] / sum * 100;
                    assert.equal(Number(p.answer), expected);
                    assert.equal(additionErrorRate(p.answer, p.answer), 0);
                }
            }
        }
        assert.ok(Object.values(counts).every(n => n > 600 && n < 900));
        assert.equal(winners.size, 2);
    } finally { Math.random = original; }
});

test('numeric error and choice accuracy remain separate, including invalid and absent answers', () => {
    const result = summarizeAddition([
        { problem: {type: 'average'}, errorRate: 0 },
        { problem: {type: 'sum'}, errorRate: 10 },
        { problem: {type: 'share'}, errorRate: null },
        { problem: {type: 'growth', scoring: 'choice'}, correct: true },
        { problem: {type: 'growth', scoring: 'choice'}, correct: false },
    ]);
    assert.equal(result.averageErrorRate, 5);
    assert.equal(result.calculationCount, 3);
    assert.equal(result.invalidCount, 1);
    assert.equal(result.comparisonAccuracy, 50);
    assert.equal(result.byType.find(t => t.type === 'share').averageErrorRate, null);
    assert.equal(summarizeAddition([{problem: {scoring: 'choice'}, correct: true}]).averageErrorRate, null);
    assert.equal(summarizeAddition([{errorRate: 0}]).comparisonAccuracy, null);
    assert.equal(additionErrorRate('22.5', 25), 10);
    assert.equal(additionErrorRate('27.5', 25), 10);
    assert.equal(additionErrorRate('', 25), null);
});

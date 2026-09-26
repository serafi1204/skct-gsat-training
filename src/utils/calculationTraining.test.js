import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateAdditionProblems } from './generateAdditionProblems.js';
import { additionErrorRate, scoreAdditionAnswer, summarizeAddition } from './additionScoring.js';

test('all four types have valid values and unambiguous O/X claims', () => {
    const original = Math.random;
    let seed = 20260926;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const counts = { average: 0, sum: 0, growth: 0, share: 0 };
    const choices = { O: 0, X: 0 };
    try {
        for (let batch = 0; batch < 100; batch++) {
            for (const problem of generateAdditionProblems(30)) {
                counts[problem.type]++;
                assert.equal(problem.values.length, 4);
                assert.ok(problem.values.every(v => Number.isInteger(v) && v >= 100 && v <= 9999));
                const sum = problem.values.reduce((a, b) => a + b, 0);
                if (problem.type === 'sum') {
                    assert.equal(problem.scoring, 'errorRate');
                    assert.equal(Number(problem.answer), sum);
                    assert.equal(scoreAdditionAnswer(problem, problem.answer).errorRate, 0);
                } else {
                    assert.equal(problem.scoring, 'ox');
                    choices[problem.answer]++;
                    assert.equal(scoreAdditionAnswer(problem, problem.answer).correct, true);
                    assert.equal(scoreAdditionAnswer(problem, problem.answer === 'O' ? 'X' : 'O').correct, false);
                    if (problem.type === 'growth') {
                        const rates = problem.pairs.map(([a, b]) => (b - a) / a * 100);
                        const gap = Math.abs(rates[0] - rates[1]);
                        assert.ok(gap >= 0.5 && gap <= 1);
                        assert.ok(Math.abs(Number(rates[0].toFixed(2)) - Number(rates[1].toFixed(2))) >= 0.5);
                        assert.equal(problem.answer, problem.claim === (rates[0] > rates[1] ? 1 : 2) ? 'O' : 'X');
                    } else {
                        const exact = problem.type === 'average' ? sum / 4 : problem.values[problem.targetIndex] / sum * 100;
                        const rounded = Number(exact.toFixed(2));
                        assert.equal(problem.answer, problem.proposed === rounded ? 'O' : 'X');
                        assert.ok(Math.abs(problem.proposed - exact) / exact <= 0.05);
                    }
                }
            }
        }
        assert.ok(Object.values(counts).every(n => n > 600 && n < 900));
        assert.ok(choices.O > 800 && choices.X > 800);
    } finally { Math.random = original; }
});

test('growth gaps remain at least 0.5 percentage points for every supported number range', () => {
    let checked = 0;
    for (const min of [100, 500, 1000, 2000, 3000]) {
        for (const max of [7000, 8000, 9000, 9999]) {
            for (let batch = 0; batch < 20; batch++) {
                for (const problem of generateAdditionProblems(30, { min, max })) {
                    if (problem.type !== 'growth') continue;
                    checked++;
                    const [first, second] = problem.pairs.map(([before, after]) => (after - before) / before * 100);
                    assert.ok(Math.abs(first - second) >= 0.5);
                    assert.ok(Math.abs(Number(first.toFixed(2)) - Number(second.toFixed(2))) >= 0.5);
                }
            }
        }
    }
    assert.ok(checked > 1000);
});

test('only sums use numeric error; other types keep separate O/X accuracy', () => {
    const results = [
        { problem: {type: 'average'}, correct: true },
        { problem: {type: 'average'}, correct: false },
        { problem: {type: 'sum'}, errorRate: 10 },
        { problem: {type: 'sum'}, errorRate: null },
        { problem: {type: 'growth'}, correct: true },
        { problem: {type: 'share'}, correct: false },
    ];
    const summary = summarizeAddition(results);
    assert.equal(summary.averageErrorRate, 10);
    assert.equal(summary.invalidCount, 1);
    assert.equal(summary.byType.find(item => item.type === 'average').accuracy, 50);
    assert.equal(summary.byType.find(item => item.type === 'growth').accuracy, 100);
    assert.equal(summary.byType.find(item => item.type === 'share').accuracy, 0);
    assert.equal(summary.byType.find(item => item.type === 'sum').averageErrorRate, 10);
    assert.equal(additionErrorRate('', 200), null);
    assert.equal(additionErrorRate('220', 200), 10);
});

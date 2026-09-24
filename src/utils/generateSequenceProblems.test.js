import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSequenceProblems, isSequenceAnswerCorrect, SEQUENCE_TYPES } from './generateSequenceProblems.js';

const constant = values => values.every(v => Math.abs(v - values[0]) < 1e-9);
const differences = values => values.slice(1).map((v, i) => v - values[i]);
const ratios = values => values.slice(1).map((v, i) => v / values[i]);
const validBranch = values => constant(differences(values)) || constant(ratios(values));

test('randomized sets obey each rule, integer bounds, lengths and uniqueness', () => {
    // Fixed pseudo-random stream makes failures reproducible.
    const originalRandom = Math.random;
    let seed = 230926;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const types = new Set();
    try {
        for (let run = 0; run < 100; run++) {
            const problems = generateSequenceProblems(30);
            assert.equal(problems.length, 30);
            assert.equal(new Set(problems.map(p => p.values.slice(0, -1).join(','))).size, 30);
            for (const p of problems) {
                types.add(p.type);
                const v = p.values, d = differences(v);
                assert.ok(v.every(n => Number.isInteger(n) && n >= 1 && n <= 999));
                assert.equal(p.answer, String(v.at(-1)));
                assert.equal(v.length, p.type === 'grouped' ? 9 : ['interleaved', 'alternating'].includes(p.type) ? 8 : 6);
                switch (p.type) {
                    case 'arithmetic': assert.ok(constant(d)); break;
                    case 'geometric': assert.ok(constant(ratios(v))); break;
                    case 'arithmeticDifference': assert.ok(constant(differences(d))); break;
                    case 'geometricDifference': assert.ok(constant(ratios(d))); break;
                    case 'interleaved':
                        assert.ok(validBranch(v.filter((_, i) => i % 2 === 0)));
                        assert.ok(validBranch(v.filter((_, i) => i % 2 === 1)));
                        break;
                    case 'alternating': {
                        const evenDifferences = d.filter((_, i) => i % 2 === 0);
                        assert.ok(constant(evenDifferences) || constant(ratios(v).filter((_, i) => i % 2 === 0)));
                        assert.ok(constant(d.filter((_, i) => i % 2 === 1)));
                        break;
                    }
                    case 'affine': assert.ok([2, 3].some(r => constant(v.slice(1).map((n, i) => n - r * v[i])))); break;
                    case 'fibonacci': assert.ok(v.slice(2).every((n, i) => n === v[i] + v[i + 1])); break;
                    case 'grouped':
                        assert.ok(['sum', 'product'].some(rule => [0, 3, 6].every(i => v[i + 2] === (rule === 'sum' ? v[i] + v[i + 1] : v[i] * v[i + 1]))));
                        break;
                    default: assert.fail(p.type);
                }
            }
        }
        assert.equal(types.size, SEQUENCE_TYPES.length);
        assert.equal(types.size, 9);
    } finally {
        Math.random = originalRandom;
    }
});

test('answers require canonical integer or reduced fraction notation', () => {
    assert.ok(isSequenceAnswerCorrect('12', '12'));
    assert.ok(isSequenceAnswerCorrect(' 1/2 ', '1/2'));
    for (const input of ['2/4', '0.5', '1 / 2', '', '01/2']) assert.equal(isSequenceAnswerCorrect(input, '1/2'), false);
    for (const input of ['4/2', '2.0', '02', '2e0', '']) assert.equal(isSequenceAnswerCorrect(input, '2'), false);
});

test('invalid counts cannot start unbounded generation', () => {
    for (const count of [0, -1, 101, 1.5, NaN]) assert.throws(() => generateSequenceProblems(count), RangeError);
});

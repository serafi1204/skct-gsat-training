import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTableProblem, joinWithAnd } from './generateTableProblem.js';

test('table question wording chooses the correct Korean conjunction', () => {
    assert.equal(joinWithAnd('일본', '중화권'), '일본과 중화권');
    assert.equal(joinWithAnd('국내총괄', '글로벌총괄'), '국내총괄과 글로벌총괄');
    assert.equal(joinWithAnd('서울', '인천'), '서울과 인천');
    assert.equal(joinWithAnd('총계', '1분기'), '총계와 1분기');
});

test('plot legend darkens from left to right and series follow steady trends', () => {
    const shades = ['#303030', '#484848', '#606060', '#787878', '#909090', '#a8a8a8', '#c0c0c0'];
    for (const [plotMin, plotMax] of [[1100, 8600], [3000, 8000]]) {
        for (let attempt = 0; attempt < 100; attempt++) {
            const problem = generateTableProblem(attempt % 2 === 0, { plot: true, plotMin, plotMax });
            for (const table of problem.tables) {
                assert.deepEqual(table.colors, shades.slice(0, table.template.rows.length));
                for (const values of table.data) {
                    assert.ok(values.every(value => value >= plotMin && value <= plotMax));
                    const changes = values.slice(1).map((value, index) => value - values[index]);
                    assert.ok(changes.every(change => Math.sign(change) === Math.sign(changes[0])));
                    const magnitudes = changes.map(Math.abs);
                    assert.ok(Math.max(...magnitudes) / Math.min(...magnitudes) < 1.5);
                }
                for (let column = 0; column < table.template.cols.length; column++) {
                    const sorted = table.data.map(row => row[column]).sort((a, b) => a - b);
                    const gaps = sorted.slice(1).map((value, index) => value - sorted[index]);
                    assert.ok(gaps.every(gap => gap > (plotMax - plotMin) / table.data.length * 0.35));
                }
            }
        }
    }
});

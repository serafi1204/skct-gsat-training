import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateDailyHistory, prepareDailyHistory } from './dailyHistory.js';

test('existing records move to today once, while later records keep their dates', () => {
    const old = [{ date: '2026. 9. 20.', dateKey: '2026-09-20', accuracy: 60 }, { accuracy: 80 }];
    const migrated = prepareDailyHistory(old, '2026-09-27', true);
    assert.deepEqual(migrated.map(record => record.dateKey), ['2026-09-27', '2026-09-27']);
    assert.deepEqual(prepareDailyHistory(migrated, '2026-09-28').map(record => record.dateKey), ['2026-09-27', '2026-09-27']);
    assert.equal(prepareDailyHistory([{ accuracy: 90 }], '2026-09-28')[0].dateKey, '2026-09-28');
});

test('daily chart averages sessions and calculation subtypes without treating missing scores as zero', () => {
    const days = aggregateDailyHistory([
        { dateKey: '2026-09-28', accuracy: 100, averageTime: 2 },
        { dateKey: '2026-09-27', accuracy: 50, averageTime: 3, byType: [{ type: 'sum', averageErrorRate: 2 }] },
        { dateKey: '2026-09-27', accuracy: 100, averageTime: 5, byType: [{ type: 'sum', averageErrorRate: 4 }, { type: 'growth', accuracy: 80 }] },
    ]);
    assert.deepEqual(days.map(day => day.dateKey), ['2026-09-27', '2026-09-28']);
    assert.equal(days[0].sessionCount, 2);
    assert.equal(days[0].accuracy, 75);
    assert.equal(days[0].averageTime, 4);
    assert.equal(days[0].byType.find(item => item.type === 'sum').averageErrorRate, 3);
    assert.equal(days[0].byType.find(item => item.type === 'growth').accuracy, 80);
    assert.equal(days[0].byType.find(item => item.type === 'average').accuracy, null);
});

test('daily calculation time separates calculator use and leaves older records unclassified', () => {
    const [day] = aggregateDailyHistory([
        { dateKey: '2026-09-27', calculatorUsed: true, averageTime: 2 },
        { dateKey: '2026-09-27', calculatorUsed: true, averageTime: 4 },
        { dateKey: '2026-09-27', calculatorUsed: false, averageTime: 6 },
        { dateKey: '2026-09-27', averageTime: 8 },
    ]);
    assert.equal(day.calculatorTime, 3);
    assert.equal(day.withoutCalculatorTime, 6);
    assert.equal(day.unclassifiedTime, 8);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculationAccuracyHistory } from './calculationHistory.js';

test('calculation chart keeps four types separate and converts sum error rate', () => {
    const [record] = calculationAccuracyHistory([{
        date: '2026-09-27',
        byType: [
            { type: 'average', accuracy: 75 },
            { type: 'sum', averageErrorRate: 2.5 },
            { type: 'growth', accuracy: 50 },
            { type: 'share', accuracy: 100 },
        ],
    }]);
    assert.deepEqual([
        record.averageAccuracy, record.sumAccuracy, record.growthAccuracy, record.shareAccuracy,
    ], [75, 97.5, 50, 100]);
});

test('missing values remain gaps and sum scores are not silently clamped', () => {
    const [oldRecord, largeError] = calculationAccuracyHistory([
        { byType: undefined },
        { byType: [{ type: 'sum', averageErrorRate: 120 }] },
    ]);
    assert.deepEqual([
        oldRecord.averageAccuracy, oldRecord.sumAccuracy, oldRecord.growthAccuracy, oldRecord.shareAccuracy,
    ], [null, null, null, null]);
    assert.equal(largeError.sumAccuracy, -20);
});

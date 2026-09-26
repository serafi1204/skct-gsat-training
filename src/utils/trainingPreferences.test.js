import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_PREFERENCES, normalizePreferences, loadPreferences, savePreferences,
    loadPlotHistory, savePlotHistory, clearPlotHistory,
} from './trainingPreferences.js';

function withCookies(run) {
    const original = globalThis.document;
    const values = new Map();
    globalThis.document = {
        get cookie() { return [...values].map(([key, value]) => `${key}=${value}`).join('; '); },
        set cookie(text) {
            const [assignment, ...attributes] = text.split('; ');
            const index = assignment.indexOf('=');
            const key = assignment.slice(0, index), value = assignment.slice(index + 1);
            if (attributes.includes('Max-Age=0')) values.delete(key);
            else values.set(key, value);
        },
    };
    try { run(values); } finally { globalThis.document = original; }
}

test('preferences are normalized and survive cookie reload', () => withCookies(() => {
    assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
    savePreferences({ ...DEFAULT_PREFERENCES, tablePlotPercent: 75, plotMin: 3000, plotMax: 7000 });
    assert.equal(loadPreferences().tablePlotPercent, 75);
    assert.equal(loadPreferences().plotMax, 8000);
    assert.equal(normalizePreferences({ sequenceMax: -1 }).sequenceMax, 300);
}));

test('result plot metrics survive cookie reload and can be cleared', () => withCookies(values => {
    const record = { examType: 'ADDITION', averageTime: 2.1, byType: [
        { type: 'average', accuracy: 75 }, { type: 'sum', averageErrorRate: 1.2 },
        { type: 'growth', accuracy: 50 }, { type: 'share', accuracy: 100 },
    ] };
    savePlotHistory(Array.from({ length: 20 }, () => record));
    const loaded = loadPlotHistory();
    assert.equal(loaded.length, 20);
    assert.equal(loaded[0].byType.find(item => item.type === 'sum').averageErrorRate, 1.2);
    assert.equal(loaded[0].averageTime, 2.1);
    assert.ok(values.get('skctPlotAddition').length < 4000);
    clearPlotHistory();
    assert.deepEqual(loadPlotHistory(), []);
}));

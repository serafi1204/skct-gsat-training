import test from 'node:test';
import assert from 'node:assert/strict';
import { handleProfileAction } from './profileApi.js';

test('new codes start empty and saved data is shared by the same code', async () => {
    const records = new Map();
    const store = {
        get: async key => records.get(key) ?? null,
        put: async (key, value) => { records.set(key, value); },
    };
    const first = await handleProfileAction({ action: 'load', code: 'sample-code' }, store);
    assert.equal(first.status, 200);
    assert.equal(first.body.exists, false);
    assert.deepEqual(first.body.profile.history, []);
    assert.equal(first.body.profile.omr.answers, '');

    const profile = { ...first.body.profile, history: [{ examType: 'TABLE', accuracy: 80 }],
        omr: { answers: '123', correct: '321' } };
    const saved = await handleProfileAction({ action: 'save', code: 'sample-code', profile }, store);
    assert.equal(saved.status, 200);
    assert.equal(records.has('sample-code'), false);
    assert.equal(records.size, 1);

    const reopened = await handleProfileAction({ action: 'load', code: 'sample-code' }, store);
    assert.equal(reopened.body.exists, true);
    assert.deepEqual(reopened.body.profile.history, profile.history);
    assert.equal(reopened.body.profile.omr.answers, '123');

    const different = await handleProfileAction({ action: 'load', code: 'other-code' }, store);
    assert.equal(different.body.exists, false);
    assert.deepEqual(different.body.profile.history, []);
});

test('rejects invalid codes and malformed saves', async () => {
    const store = { get: async () => null, put: async () => {} };
    assert.equal((await handleProfileAction({ action: 'load', code: ' ' }, store)).status, 400);
    assert.equal((await handleProfileAction({ action: 'save', code: 'a', profile: [] }, store)).status, 400);
});

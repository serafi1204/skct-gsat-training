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
    assert.deepEqual(first.body.profile.mockExams, []);

    const mockExam = { id: 'exam-1', name: '실전 1회', date: '2026-09-29',
        answers: '12345'.repeat(20), correct: '12345'.repeat(20),
        createdAt: '2026-09-29T00:00:00Z', updatedAt: '2026-09-29T00:00:00Z' };
    const profile = { ...first.body.profile, history: [{ examType: 'TABLE', accuracy: 80 }],
        omr: { answers: '123', correct: '321' }, mockExams: [mockExam],
        subjectNotes: { ...first.body.profile.subjectNotes, 자료해석: '단위 확인\n그래프 축 먼저 읽기' } };
    const saved = await handleProfileAction({ action: 'save', code: 'sample-code', profile }, store);
    assert.equal(saved.status, 200);
    assert.equal(records.has('sample-code'), false);
    assert.equal(records.size, 1);

    const reopened = await handleProfileAction({ action: 'load', code: 'sample-code' }, store);
    assert.equal(reopened.body.exists, true);
    assert.deepEqual(reopened.body.profile.history, profile.history);
    assert.equal(reopened.body.profile.omr.answers, '123');
    assert.deepEqual(reopened.body.profile.subjectNotes, profile.subjectNotes);
    assert.equal(reopened.body.profile.mockExams[0].name, mockExam.name);
    assert.equal(reopened.body.profile.mockExams[0].date, mockExam.date);
    assert.equal(reopened.body.profile.mockExams[0].answers.replace(/\n/g, ''), mockExam.answers);
    assert.equal(reopened.body.profile.mockExams[0].correct.replace(/\n/g, ''), mockExam.correct);

    const different = await handleProfileAction({ action: 'load', code: 'other-code' }, store);
    assert.equal(different.body.exists, false);
    assert.deepEqual(different.body.profile.history, []);
    assert.equal(different.body.profile.subjectNotes.자료해석, '');
});

test('rejects invalid codes and malformed saves', async () => {
    const store = { get: async () => null, put: async () => {} };
    assert.equal((await handleProfileAction({ action: 'load', code: ' ' }, store)).status, 400);
    assert.equal((await handleProfileAction({ action: 'save', code: 'a', profile: [] }, store)).status, 400);
});

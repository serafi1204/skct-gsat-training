import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMockExams, normalizeMockExamRecord, scoreMockExam, validateMockExamInput } from './mockExamRecords.js';
import { normalizeStoredProfile } from './storedProfile.js';

const key = '12345'.repeat(20);
const record = (id, date, answers, name = `모의고사 ${id}`) => ({
    id, date, name, answers, correct: key, createdAt: `2026-09-29T00:00:0${id}Z`, updatedAt: `2026-09-29T00:00:0${id}Z`,
});

test('recent averages report actual sample size and compare only complete groups of three', () => {
    const exams = Array.from({ length: 30 }, (_, index) => record(String(index), '2026-09-29', key.slice(0, index + 1)));
    for (const count of [0, 1, 2, 3, 5, 6, 30]) {
        const analysis = analyzeMockExams(exams.slice(0, count));
        assert.equal(analysis.recentCount, Math.min(count, 3));
        assert.equal(analysis.sorted.length, count);
        assert.equal(analysis.earlierAverage === null, count < 6);
    }
    const six = analyzeMockExams(exams.slice(0, 6));
    assert.equal(six.recentAverage, 5);
    assert.equal(six.earlierAverage, 2);
});

test('lowest sections include ties, all-perfect and all-unanswered records', () => {
    assert.deepEqual(analyzeMockExams([]).weakestSections, []);
    const unanswered = analyzeMockExams([record('a', '2026-09-29', '0'.repeat(100))]);
    assert.equal(unanswered.weakestSections.length, 5);
    assert.equal(unanswered.latest.result.accuracy, null);
    assert.equal(unanswered.latest.result.total.unanswered, 100);
    const perfect = analyzeMockExams([record('a', '2026-09-29', key)]);
    assert.equal(perfect.weakestSections.length, 5);
    assert.equal(perfect.weakest.score, 20);
    const tied = analyzeMockExams([record('a', '2026-09-29', key.slice(0, 60) + '0'.repeat(40))]);
    assert.deepEqual(tied.weakestSections.map(section => section.name), ['언어추리', '수열추리']);
});

test('requires all 100 answer-key choices and a name and date', () => {
    assert.match(validateMockExamInput(record('a', '2026-09-29', '', ' ')), /이름/);
    assert.match(validateMockExamInput(record('a', '2026-02-30', '')), /날짜/);
    assert.match(validateMockExamInput({ ...record('a', '2026-09-29', ''), correct: '1'.repeat(99) }), /100문항/);
    assert.match(validateMockExamInput({ ...record('a', '2026-09-29', ''), correct: `${'1'.repeat(99)}0` }), /100문항/);
    assert.equal(validateMockExamInput(record('a', '2026-09-29', '')), '');
});

test('zero is unanswered and score distinguishes attempts from correctness', () => {
    const exam = record('a', '2026-09-29', `1${'0'.repeat(19)}\n2${'0'.repeat(79)}`);
    const result = scoreMockExam(exam);
    assert.deepEqual(result.total, { attempted: 2, correct: 1, wrong: 1, unanswered: 98 });
    assert.deepEqual(result.sections[0], { attempted: 1, correct: 1, wrong: 0, unanswered: 19 });
    assert.equal(result.score, 1);
    assert.equal(result.accuracy, 50);
});

test('records survive profile normalization; edits and deletes change analysis', () => {
    const first = record('a', '2026-09-27', '1'.repeat(100));
    const second = record('b', '2026-09-28', '2'.repeat(100));
    let profile = normalizeStoredProfile({ history: [{ examType: 'TABLE', accuracy: 80 }], omr: { answers: '5' }, mockExams: [first, second] });
    assert.equal(profile.mockExams.length, 2);
    assert.deepEqual(profile.history, [{ examType: 'TABLE', accuracy: 80 }]);
    assert.equal(profile.omr.answers, '5');
    assert.equal(analyzeMockExams(profile.mockExams).latest.result.score, 20);

    profile = normalizeStoredProfile({ ...profile, mockExams: profile.mockExams.map(item => item.id === 'b'
        ? { ...item, name: '수정한 시험', answers: '1'.repeat(100) } : item) });
    assert.equal(analyzeMockExams(profile.mockExams).latest.result.score, 20);
    assert.equal(profile.mockExams[1].name, '수정한 시험');

    profile = normalizeStoredProfile({ ...profile, mockExams: profile.mockExams.filter(item => item.id !== 'b') });
    assert.equal(analyzeMockExams(profile.mockExams).sorted.length, 1);
});

test('analysis orders by exam date and identifies weakest recent section', () => {
    const older = record('a', '2026-09-01', '1'.repeat(100));
    const newer = record('b', '2026-09-03', `${'1'.repeat(20)}${'0'.repeat(80)}`);
    const analysis = analyzeMockExams([newer, older]);
    assert.deepEqual(analysis.sorted.map(item => item.id), ['a', 'b']);
    assert.equal(analysis.latest.id, 'b');
    assert.equal(analysis.recentAverage, 12);
    assert.equal(analysis.sectionAverages[0].score, 4);
    assert.equal(analysis.weakest.name, '자료해석');
    assert.equal(analysis.weakest.wrong, 8);
    assert.equal(analysis.weakest.unanswered, 10);
    assert.equal(analysis.weakest.cause, '미풀이가 더 많음');
    assert.equal(analyzeMockExams([older]).weakest.cause, '오답이 더 많음');
    assert.equal(analyzeMockExams([record('c', '2026-09-04', key)]).weakest.cause, '오답·미풀이 없음');
    assert.equal(normalizeMockExamRecord({ ...older, correct: '1' }), null);
});

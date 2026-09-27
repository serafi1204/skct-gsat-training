import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOmrText, normalizeOmrText, parseOmrText } from './omrText.js';

test('OMR text wraps every 20 answers and keeps blank positions as zero', () => {
    const answers = Array(100).fill(null);
    answers[0] = 3;
    answers[20] = 5;
    answers[99] = 1;

    const text = formatOmrText(answers);
    const lines = text.split('\n');
    assert.equal(lines.length, 5);
    assert.ok(lines.every(line => line.length === 20));
    assert.equal(lines[0], `3${'0'.repeat(19)}`);
    assert.equal(lines[1], `5${'0'.repeat(19)}`);
    assert.equal(lines[4], `${'0'.repeat(19)}1`);
    assert.deepEqual(parseOmrText(text), answers);
});

test('short TXT entries remain short while preserving 20-question lines', () => {
    assert.equal(normalizeOmrText(`${'1'.repeat(21)}\n23`), `${'1'.repeat(20)}\n1\n23`);
    const answers = parseOmrText('12\n34');
    assert.deepEqual(answers.slice(0, 3), [1, 2, null]);
    assert.deepEqual(answers.slice(20, 23), [3, 4, null]);
    assert.equal(formatOmrText(answers), `12${'0'.repeat(18)}\n34`);
    assert.equal(formatOmrText(Array(100).fill(null)), '');
});

test('TXT accepts only choices 0 to 5 and never extends beyond 100 questions', () => {
    assert.equal(normalizeOmrText('1 2 9 3 x 0'), '1230');
    const text = normalizeOmrText('5'.repeat(120));
    assert.equal(text.replace(/\n/g, '').length, 100);
    assert.equal(parseOmrText(text).length, 100);
    assert.equal(parseOmrText('0')[0], null);
});

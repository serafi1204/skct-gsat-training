import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOmrText, saveOmrText } from './omrStorage.js';

function cookieJar() {
    const values = new Map();
    return {
        get cookie() { return [...values].map(([name, value]) => `${name}=${value}`).join('; '); },
        set cookie(header) {
            const pair = header.split(';')[0];
            const separator = pair.indexOf('=');
            values.set(pair.slice(0, separator), pair.slice(separator + 1));
        },
    };
}

test('answer and correct TXT values survive independent cookie reloads', () => {
    const jar = cookieJar();
    saveOmrText('answers', '123\n405', jar);
    saveOmrText('correct', '321\n540', jar);
    assert.equal(loadOmrText('answers', jar), '123\n405');
    assert.equal(loadOmrText('correct', jar), '321\n540');

    saveOmrText('answers', '5', jar);
    assert.equal(loadOmrText('answers', jar), '5');
    assert.equal(loadOmrText('correct', jar), '321\n540');
});

test('invalid cookie text falls back to an empty OMR field', () => {
    const jar = cookieJar();
    jar.cookie = 'skctOmrAnswers=%E0%A4%A';
    assert.equal(loadOmrText('answers', jar), '');
});

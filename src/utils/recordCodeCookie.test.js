import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRecordCode, saveRecordCode, clearRecordCode } from './recordCodeCookie.js';

test('record code cookie round-trips special characters and has a 30-day expiry', () => {
    const jar = { cookie: '' };
    saveRecordCode('개인 코드 ; = %', jar, 'https:');
    assert.equal(loadRecordCode(jar), '개인 코드 ; = %');
    assert.match(jar.cookie, /Max-Age=2592000/);
    assert.match(jar.cookie, /SameSite=Lax/);
    assert.match(jar.cookie, /; Secure$/);
    clearRecordCode(jar, 'https:');
    assert.equal(loadRecordCode(jar), '');
    assert.match(jar.cookie, /Max-Age=0/);
});

test('legacy, malformed, missing and oversized cookies do not auto-open a code', () => {
    for (const cookie of ['', 'skctOmrAnswers=12345', 'skctRecordCode=%E0%A4%A', `skctRecordCode=${'a'.repeat(129)}`]) {
        assert.equal(loadRecordCode({ cookie }), '');
    }
    assert.equal(loadRecordCode({ cookie: 'other=x;skctRecordCode=hello; another=y' }), 'hello');
    const jar = { cookie: '' };
    saveRecordCode('local', jar, 'http:');
    assert.doesNotMatch(jar.cookie, /Secure/);
});

test('blocked cookies do not break manual record access', () => {
    const jar = { get cookie() { throw new Error('blocked'); }, set cookie(_) { throw new Error('blocked'); } };
    assert.equal(loadRecordCode(jar), '');
    assert.doesNotThrow(() => saveRecordCode('code', jar, 'https:'));
    assert.doesNotThrow(() => clearRecordCode(jar, 'https:'));
});

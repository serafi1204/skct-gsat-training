import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTimer, initialTimers, tickTimers, updateTimer } from './practiceTimers.js';

test('15-minute and 1-minute timers run independently and finish from wall-clock time', () => {
    let timers = initialTimers();
    timers = updateTimer(timers, 'fifteen', 'start', 1000);
    timers = updateTimer(timers, 'one', 'start', 1000);
    timers = tickTimers(timers, 61000);
    assert.equal(timers.one.complete, true);
    assert.equal(timers.fifteen.complete, false);
    assert.equal(formatTimer(timers.fifteen.remainingMs), '14:00');
    timers = tickTimers(timers, 901000);
    assert.equal(timers.fifteen.complete, true);
    assert.equal(formatTimer(timers.fifteen.remainingMs), '00:00');
});

test('pause, resume, dismiss, and reset affect only the selected timer', () => {
    let timers = updateTimer(initialTimers(), 'one', 'start', 0);
    timers = updateTimer(timers, 'one', 'pause', 15000);
    assert.equal(formatTimer(timers.one.remainingMs), '00:45');
    timers = tickTimers(timers, 100000);
    assert.equal(formatTimer(timers.one.remainingMs), '00:45');
    timers = updateTimer(timers, 'one', 'start', 100000);
    timers = tickTimers(timers, 145000);
    assert.equal(timers.one.complete, true);
    timers = updateTimer(timers, 'one', 'dismiss');
    assert.equal(timers.one.dismissed, true);
    timers = updateTimer(timers, 'one', 'reset');
    assert.equal(formatTimer(timers.one.remainingMs), '01:00');
    assert.equal(timers.fifteen.remainingMs, 900000);
});

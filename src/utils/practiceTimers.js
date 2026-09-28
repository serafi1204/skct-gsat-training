export const TIMER_DURATIONS = Object.freeze({ fifteen: 15 * 60 * 1000, one: 60 * 1000 });

export const initialTimers = () => Object.fromEntries(Object.entries(TIMER_DURATIONS).map(([id, duration]) => [id, {
    remainingMs: duration,
    endsAt: null,
    complete: false,
    dismissed: false,
}]));

export function updateTimer(timers, id, action, now = Date.now()) {
    if (!(id in TIMER_DURATIONS)) return timers;
    const timer = timers[id];
    let next;
    if (action === 'start') {
        const remainingMs = timer.remainingMs;
        next = { remainingMs, endsAt: now + remainingMs, complete: false, dismissed: false };
    } else if (action === 'pause' && timer.endsAt !== null) {
        const remainingMs = Math.max(0, timer.endsAt - now);
        next = { remainingMs: remainingMs || TIMER_DURATIONS[id], endsAt: null, complete: remainingMs === 0, dismissed: false };
    } else if (action === 'reset') {
        next = { remainingMs: TIMER_DURATIONS[id], endsAt: null, complete: false, dismissed: false };
    } else if (action === 'dismiss' && timer.complete) {
        next = { ...timer, complete: false, dismissed: true };
    } else {
        return timers;
    }
    return { ...timers, [id]: next };
}

export function tickTimers(timers, now = Date.now()) {
    let updated = timers;
    for (const id of Object.keys(TIMER_DURATIONS)) {
        const timer = updated[id];
        if (timer.endsAt === null) continue;
        const remainingMs = Math.max(0, timer.endsAt - now);
        if (remainingMs === 0) {
            updated = { ...updated, [id]: { remainingMs: TIMER_DURATIONS[id], endsAt: null, complete: true, dismissed: false } };
        } else if (Math.ceil(remainingMs / 1000) !== Math.ceil(timer.remainingMs / 1000)) {
            updated = { ...updated, [id]: { ...timer, remainingMs } };
        }
    }
    return updated;
}

export function formatTimer(remainingMs) {
    const seconds = Math.ceil(remainingMs / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_TODO_COUNT, TODO_MODES, localDateKey, normalizeDailyTodo,
    resizeDailyTodo, toggleDailyTodo, dailyTodoProgress, loadDailyTodo, saveDailyTodo,
} from './dailyTodo.js';

test('each training starts with three independent daily checklist items', () => {
    const todo = normalizeDailyTodo(null, '2026-09-27');
    for (const mode of TODO_MODES) {
        assert.equal(todo.counts[mode], DEFAULT_TODO_COUNT);
        assert.deepEqual(todo.checked[mode], [false, false, false]);
    }
    assert.deepEqual(dailyTodoProgress(todo), { done: 0, total: 12 });
});

test('checks and per-training counts persist while a new day resets only checks', () => {
    const memory = new Map();
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
    let todo = normalizeDailyTodo(null, '2026-09-27');
    todo = resizeDailyTodo(todo, 'SEQUENCE', 5, '2026-09-27');
    todo = toggleDailyTodo(todo, 'SEQUENCE', 3, '2026-09-27');
    saveDailyTodo(todo, storage);
    assert.equal(loadDailyTodo(storage, '2026-09-27').checked.SEQUENCE[3], true);
    const tomorrow = loadDailyTodo(storage, '2026-09-28');
    assert.equal(tomorrow.counts.SEQUENCE, 5);
    assert.deepEqual(tomorrow.checked.SEQUENCE, [false, false, false, false, false]);
    assert.deepEqual(dailyTodoProgress(tomorrow), { done: 0, total: 14 });
});

test('resizing trims removed checkboxes and keeps other training untouched', () => {
    let todo = normalizeDailyTodo(null, '2026-09-27');
    todo = toggleDailyTodo(todo, 'TABLE', 2, '2026-09-27');
    todo = toggleDailyTodo(todo, 'PATTERN', 0, '2026-09-27');
    todo = resizeDailyTodo(todo, 'TABLE', 1, '2026-09-27');
    todo = resizeDailyTodo(todo, 'TABLE', 3, '2026-09-27');
    assert.deepEqual(todo.checked.TABLE, [false, false, false]);
    assert.deepEqual(todo.checked.PATTERN, [true, false, false]);
    assert.equal(localDateKey(new Date(2026, 8, 27, 23, 59)), '2026-09-27');
});

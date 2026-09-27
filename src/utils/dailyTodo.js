export const TODO_STORAGE_KEY = 'skctDailyTodo';
export const TODO_MODES = ['TABLE', 'PATTERN', 'SEQUENCE', 'ADDITION'];
export const DEFAULT_TODO_COUNT = 3;
export const MAX_TODO_COUNT = 10;

export const localDateKey = (date = new Date()) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
].join('-');

export function normalizeDailyTodo(value, date = localDateKey()) {
    const source = value && typeof value === 'object' ? value : {};
    const sameDay = source.date === date;
    const counts = {};
    const checked = {};
    for (const mode of TODO_MODES) {
        const rawCount = source.counts?.[mode];
        const candidate = rawCount == null ? NaN : Number(rawCount);
        counts[mode] = Number.isInteger(candidate)
            ? Math.min(MAX_TODO_COUNT, Math.max(0, candidate))
            : DEFAULT_TODO_COUNT;
        checked[mode] = Array.from({ length: counts[mode] }, (_, index) =>
            sameDay && source.checked?.[mode]?.[index] === true);
    }
    return { date, counts, checked };
}

export function loadDailyTodo(storage = localStorage, date = localDateKey()) {
    try { return normalizeDailyTodo(JSON.parse(storage.getItem(TODO_STORAGE_KEY)), date); }
    catch { return normalizeDailyTodo(null, date); }
}

export function saveDailyTodo(todo, storage = localStorage) {
    storage.setItem(TODO_STORAGE_KEY, JSON.stringify(todo));
}

export function resizeDailyTodo(todo, mode, count, date = localDateKey()) {
    const current = normalizeDailyTodo(todo, date);
    if (!TODO_MODES.includes(mode)) return current;
    const nextCount = Math.min(MAX_TODO_COUNT, Math.max(0, Math.trunc(count)));
    return normalizeDailyTodo({
        ...current,
        counts: { ...current.counts, [mode]: nextCount },
        checked: { ...current.checked, [mode]: current.checked[mode].slice(0, nextCount) },
    }, date);
}

export function toggleDailyTodo(todo, mode, index, date = localDateKey()) {
    const current = normalizeDailyTodo(todo, date);
    if (!TODO_MODES.includes(mode) || index < 0 || index >= current.counts[mode]) return current;
    const nextChecked = [...current.checked[mode]];
    nextChecked[index] = !nextChecked[index];
    return { ...current, checked: { ...current.checked, [mode]: nextChecked } };
}

export function dailyTodoProgress(todo) {
    return TODO_MODES.reduce((progress, mode) => ({
        done: progress.done + todo.checked[mode].filter(Boolean).length,
        total: progress.total + todo.counts[mode],
    }), { done: 0, total: 0 });
}

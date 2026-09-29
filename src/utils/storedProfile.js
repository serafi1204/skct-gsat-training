import { normalizeDailyTodo, localDateKey } from './dailyTodo.js';
import { normalizeOmrText } from './omrText.js';
import { normalizePreferences } from './trainingPreferences.js';

export function normalizeStoredProfile(value, today = localDateKey()) {
    const source = value && typeof value === 'object' ? value : {};
    const omr = source.omr && typeof source.omr === 'object' ? source.omr : {};
    return {
        preferences: normalizePreferences(source.preferences),
        history: Array.isArray(source.history) ? source.history.filter(record => record && typeof record === 'object') : [],
        todo: normalizeDailyTodo(source.todo, today),
        omr: {
            answers: normalizeOmrText(typeof omr.answers === 'string' ? omr.answers : ''),
            correct: normalizeOmrText(typeof omr.correct === 'string' ? omr.correct : ''),
        },
    };
}


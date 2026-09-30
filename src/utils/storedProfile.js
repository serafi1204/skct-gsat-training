import { normalizeDailyTodo, localDateKey } from './dailyTodo.js';
import { normalizeOmrText } from './omrText.js';
import { MOCK_EXAM_SECTIONS, normalizeMockExamRecord } from './mockExamRecords.js';
import { normalizePreferences } from './trainingPreferences.js';

export function normalizeStoredProfile(value, today = localDateKey()) {
    const source = value && typeof value === 'object' ? value : {};
    const omr = source.omr && typeof source.omr === 'object' ? source.omr : {};
    return {
        preferences: normalizePreferences(source.preferences),
        history: Array.isArray(source.history) ? source.history.filter(record => record && typeof record === 'object') : [],
        mockExams: Array.isArray(source.mockExams) ? source.mockExams.map(normalizeMockExamRecord).filter(Boolean) : [],
        subjectNotes: Object.fromEntries(MOCK_EXAM_SECTIONS.map(section => [section,
            typeof source.subjectNotes?.[section] === 'string' ? source.subjectNotes[section] : '',
        ])),
        todo: normalizeDailyTodo(source.todo, today),
        omr: {
            answers: normalizeOmrText(typeof omr.answers === 'string' ? omr.answers : ''),
            correct: normalizeOmrText(typeof omr.correct === 'string' ? omr.correct : ''),
        },
    };
}


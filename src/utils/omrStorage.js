import { normalizeOmrText } from './omrText.js';

const cookieNames = { answers: 'skctOmrAnswers', correct: 'skctOmrCorrect' };
const cookieOptions = '; Path=/; SameSite=Lax; Max-Age=31536000';

export function loadOmrText(kind, cookieStore = document) {
    const name = cookieNames[kind];
    if (!name) return '';
    const cookie = cookieStore.cookie.split('; ').find(part => part.startsWith(`${name}=`));
    if (!cookie) return '';
    try { return normalizeOmrText(decodeURIComponent(cookie.slice(name.length + 1))); }
    catch { return ''; }
}

export function saveOmrText(kind, value, cookieStore = document) {
    const name = cookieNames[kind];
    if (!name) return;
    cookieStore.cookie = `${name}=${encodeURIComponent(normalizeOmrText(value))}${cookieOptions}`;
}

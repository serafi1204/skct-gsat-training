export const DEFAULT_PREFERENCES = Object.freeze({
    examType: 'TABLE',
    totalRounds: 5,
    problemCount: 20,
    tablePlotPercent: 50,
    tableMin: 1000,
    tableMax: 9999,
    plotMin: 1100,
    plotMax: 8600,
    patternSubstitutionPercent: 15,
    sequenceMax: 999,
    calculationMin: 100,
    calculationMax: 9999,
});

const limits = {
    tablePlotPercent: [0, 100], tableMin: [100, 4000], tableMax: [5000, 9999],
    plotMin: [100, 3000], plotMax: [7000, 9999],
    patternSubstitutionPercent: [0, 100], sequenceMax: [300, 999],
    calculationMin: [100, 3000], calculationMax: [7000, 9999],
};

export function normalizePreferences(value = {}) {
    const source = value && typeof value === 'object' ? value : {};
    const next = { ...DEFAULT_PREFERENCES };
    if (['TABLE', 'PATTERN', 'SEQUENCE', 'ADDITION'].includes(source.examType)) next.examType = source.examType;
    if ([5, 10, 20, 30].includes(Number(source.totalRounds))) next.totalRounds = Number(source.totalRounds);
    if ([5, 10, 20, 30].includes(Number(source.problemCount))) next.problemCount = Number(source.problemCount);
    for (const [key, [min, max]] of Object.entries(limits)) {
        const number = Number(source[key]);
        if (source[key] !== undefined && Number.isFinite(number)) next[key] = Math.round(Math.min(max, Math.max(min, number)));
    }
    // Keep enough room for distinct plot labels, and a useful spread of table/calculation values.
    if (next.plotMax - next.plotMin < 5000) next.plotMax = next.plotMin + 5000;
    if (next.tableMax - next.tableMin < 1000) next.tableMax = next.tableMin + 1000;
    if (next.calculationMax - next.calculationMin < 1000) next.calculationMax = next.calculationMin + 1000;
    return next;
}

const cookieOptions = '; Path=/; SameSite=Lax; Max-Age=31536000';
const cookieNames = {
    preferences: 'skctPreferences',
    TABLE: 'skctPlotTable', PATTERN: 'skctPlotPattern',
    SEQUENCE: 'skctPlotSequence', ADDITION: 'skctPlotAddition',
};

function readCookie(name) {
    const item = document.cookie.split('; ').find(part => part.startsWith(`${name}=`));
    if (!item) return null;
    try { return JSON.parse(decodeURIComponent(item.slice(name.length + 1))); }
    catch { return null; }
}

function writeCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}${cookieOptions}`;
}

export function loadPreferences() {
    return normalizePreferences(readCookie(cookieNames.preferences));
}

export function savePreferences(value) {
    writeCookie(cookieNames.preferences, normalizePreferences(value));
}

const modes = ['TABLE', 'PATTERN', 'SEQUENCE', 'ADDITION'];
const chartRecord = record => [
    record.examType, record.accuracy ?? null, record.averageTime ?? null,
    ['average', 'sum', 'growth', 'share'].map(type => {
        const item = record.byType?.find(entry => entry.type === type);
        return item ? [item.accuracy ?? null, item.averageErrorRate ?? null] : null;
    }),
];

const expandChartRecord = item => ({
    examType: item[0], accuracy: item[1], averageTime: item[2],
    byType: Array.isArray(item[3]) ? ['average', 'sum', 'growth', 'share'].map((type, index) => ({
        type, accuracy: item[3][index]?.[0] ?? null, averageErrorRate: item[3][index]?.[1] ?? null,
    })) : undefined,
});

export function savePlotHistory(history) {
    for (const mode of modes) {
        const records = history.filter(item => (mode === 'TABLE' ? ['TABLE', 'PLOT'] : [mode]).includes(item.examType))
            .slice(-20).map(chartRecord);
        writeCookie(cookieNames[mode], records);
    }
}

export function loadPlotHistory() {
    return modes.flatMap(mode => {
        const records = readCookie(cookieNames[mode]);
        return Array.isArray(records) ? records.filter(record => Array.isArray(record) && record.length >= 3).map(expandChartRecord) : [];
    });
}

export function clearPlotHistory() {
    for (const mode of modes) document.cookie = `${cookieNames[mode]}=; Path=/; SameSite=Lax; Max-Age=0`;
}

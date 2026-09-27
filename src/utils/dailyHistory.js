import { localDateKey } from './dailyTodo.js';

export const DAILY_HISTORY_VERSION_KEY = 'skctHistoryDailyVersion';

const calculationTypes = ['average', 'sum', 'growth', 'share'];
const mean = values => {
    const valid = values.filter(Number.isFinite);
    return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length * 100) / 100 : null;
};

export function prepareDailyHistory(records, today = localDateKey(), migrateExisting = false) {
    return records.map(record => ({
        ...record,
        dateKey: migrateExisting ? today : record.dateKey || today,
    }));
}

export function aggregateDailyHistory(records) {
    const groups = new Map();
    for (const record of records) {
        if (!record.dateKey) continue;
        if (!groups.has(record.dateKey)) groups.set(record.dateKey, []);
        groups.get(record.dateKey).push(record);
    }
    return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, dayRecords]) => ({
        dateKey,
        date: dateKey,
        sessionCount: dayRecords.length,
        accuracy: mean(dayRecords.map(record => record.accuracy)),
        averageTime: mean(dayRecords.map(record => record.averageTime)),
        calculatorTime: mean(dayRecords.filter(record => record.calculatorUsed === true).map(record => record.averageTime)),
        withoutCalculatorTime: mean(dayRecords.filter(record => record.calculatorUsed === false).map(record => record.averageTime)),
        unclassifiedTime: mean(dayRecords.filter(record => record.calculatorUsed !== true && record.calculatorUsed !== false).map(record => record.averageTime)),
        byType: calculationTypes.map(type => {
            const items = dayRecords.map(record => record.byType?.find(item => item.type === type));
            return {
                type,
                accuracy: mean(items.map(item => item?.accuracy)),
                averageErrorRate: mean(items.map(item => item?.averageErrorRate)),
            };
        }),
    }));
}

export function calculationAccuracyHistory(history) {
    return history.map(record => {
        const byType = type => record.byType?.find(item => item.type === type);
        const accuracy = type => {
            const value = byType(type)?.accuracy;
            return Number.isFinite(value) ? value : null;
        };
        const errorRate = byType('sum')?.averageErrorRate;
        return {
            ...record,
            averageAccuracy: accuracy('average'),
            sumAccuracy: Number.isFinite(errorRate) ? 100 - errorRate : null,
            growthAccuracy: accuracy('growth'),
            shareAccuracy: accuracy('share'),
        };
    });
}

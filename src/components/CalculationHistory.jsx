import React from 'react';
import HistoryChart from './HistoryChart';
import { calculationAccuracyHistory } from '../utils/calculationHistory.js';

const accuracySeries = [
    { key: 'averageAccuracy', label: '평균 판단', color: '#0f766e' },
    { key: 'sumAccuracy', label: '합 계산', color: '#dc7a39' },
    { key: 'growthAccuracy', label: '증가율 비교', color: '#526db3' },
    { key: 'shareAccuracy', label: '전체 대비 비율', color: '#a45d9f' },
];
const timeSeries = [
    { key: 'withoutCalculatorTime', label: '계산기 미사용', color: '#0f766e' },
    { key: 'calculatorTime', label: '계산기 사용', color: '#dc7a39' },
];
const legacyTimeSeries = { key: 'unclassifiedTime', label: '기존 기록 (구분 없음)', color: '#8ca2a9' };

export default function CalculationHistory({ history }) {
    const recent = history.slice(-20);
    const visibleTimeSeries = recent.some(record => record.unclassifiedTime !== null && record.unclassifiedTime !== undefined)
        ? [...timeSeries, legacyTimeSeries] : timeSeries;
    return (
        <div className="calculation-history-grid">
            <section>
                <h4 className="text-sm font-semibold mb-2">유형별 정답률</h4>
                <HistoryChart history={calculationAccuracyHistory(recent)} series={accuracySeries} showTime={false} compact />
            </section>
            <section>
                <h4 className="text-sm font-semibold mb-2">소요 시간 — 계산기 사용 여부</h4>
                <HistoryChart history={recent} series={visibleTimeSeries} seriesLabel="문항당 평균 시간 (초)" seriesMax={null} showTime={false} compact />
            </section>
            <p className="calculation-history-note text-xs text-gray-500">합 점수 = 100 - 평균 오차율{visibleTimeSeries.includes(legacyTimeSeries) ? ' · 기존 시간 기록은 구분 없음' : ''}</p>
        </div>
    );
}

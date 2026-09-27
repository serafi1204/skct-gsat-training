import React from 'react';
import HistoryChart from './HistoryChart';
import { calculationAccuracyHistory } from '../utils/calculationHistory.js';

const accuracySeries = [
    { key: 'averageAccuracy', label: '평균 판단', color: '#0f766e' },
    { key: 'sumAccuracy', label: '합 계산', color: '#dc7a39' },
    { key: 'growthAccuracy', label: '증가율 비교', color: '#526db3' },
    { key: 'shareAccuracy', label: '전체 대비 비율', color: '#a45d9f' },
];

export default function CalculationHistory({ history }) {
    const recent = history.slice(-20);
    return (
        <div className="space-y-6">
            <section>
                <h4 className="text-sm font-semibold mb-2">유형별 정답률</h4>
                <HistoryChart history={calculationAccuracyHistory(recent)} series={accuracySeries} showTime={false} />
            </section>
            <section>
                <h4 className="text-sm font-semibold mb-2">통합 소요 시간 — 전체 문항 평균</h4>
                <HistoryChart history={recent} metric="averageTime" showTime={false} />
            </section>
            <p className="text-xs text-gray-500">합 계산은 100 - 평균 오차율로 환산하며, 나머지 유형은 정답률입니다. 유형별 정보가 없는 과거 기록은 빈칸으로 표시합니다. 시간은 모든 유형을 합친 문항당 평균입니다.</p>
        </div>
    );
}

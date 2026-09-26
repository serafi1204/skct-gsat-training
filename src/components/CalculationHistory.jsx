import React from 'react';
import HistoryChart from './HistoryChart';

export default function CalculationHistory({ history }) {
    const recent = history.slice(-20);
    return (
        <div className="space-y-6">
            {[
                { type: 'average', label: '평균 판단 — 정답률' },
                { type: 'sum', label: '합 — 오차율' },
                { type: 'growth', label: '증가율 비교 — 정답률' },
                { type: 'share', label: '전체 대비 비율 판단 — 정답률' },
            ].map(({ type, label }) => (
                <section key={type}>
                    <h4 className="text-sm font-semibold mb-2">{label}</h4>
                    <HistoryChart
                        showTime={false}
                        metric={type === 'sum' ? 'averageErrorRate' : 'accuracy'}
                        history={recent.map(record => ({
                            ...record,
                            averageErrorRate: record.byType?.find(item => item.type === type)?.averageErrorRate ?? null,
                            accuracy: record.byType?.find(item => item.type === type)?.accuracy ?? null,
                        }))}
                    />
                </section>
            ))}
            <section>
                <h4 className="text-sm font-semibold mb-2">통합 소요 시간 — 전체 문항 평균</h4>
                <HistoryChart history={recent} metric="averageTime" showTime={false} />
            </section>
            <p className="text-xs text-gray-500">네 그래프의 회차는 동일합니다. 합은 유효 응답의 오차율(낮을수록 좋음), 평균·증가율·비율 판단은 정답률(높을수록 좋음)입니다. 과거 방식의 기록 등 유형별 정보가 없는 회차는 빈칸으로 표시합니다. 시간은 모든 유형을 합친 문항당 평균입니다.</p>
        </div>
    );
}

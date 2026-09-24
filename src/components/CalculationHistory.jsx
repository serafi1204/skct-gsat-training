import React from 'react';
import HistoryChart from './HistoryChart';

export default function CalculationHistory({ history }) {
    const recent = history.slice(-20);
    return (
        <div className="space-y-6">
            {[
                { type: 'average', label: '평균 — 오차율' },
                { type: 'sum', label: '합 — 오차율' },
                { type: 'growth', label: '증가율 비교 — 정답률' },
                { type: 'share', label: '전체 대비 비율 — 오차율' },
            ].map(({ type, label }) => (
                <section key={type}>
                    <h4 className="text-sm font-semibold mb-2">{label}</h4>
                    <HistoryChart
                        showTime={false}
                        metric={type === 'growth' ? 'comparisonAccuracy' : 'averageErrorRate'}
                        history={recent.map(record => ({
                            ...record,
                            averageErrorRate: record.byType?.find(item => item.type === type)?.averageErrorRate ?? null,
                        }))}
                    />
                </section>
            ))}
            <section>
                <h4 className="text-sm font-semibold mb-2">통합 소요 시간 — 전체 문항 평균</h4>
                <HistoryChart history={recent} metric="averageTime" showTime={false} />
            </section>
            <p className="text-xs text-gray-500">네 그래프의 회차는 동일합니다. 평균·합·비율은 유효 응답의 오차율(낮을수록 좋음), 증가율 비교는 정답률(높을수록 좋음)입니다. 미출제·유효 응답 없음·유형별 정보가 없는 과거 기록은 빈칸으로 표시합니다. 시간은 모든 유형을 합친 문항당 평균입니다.</p>
        </div>
    );
}

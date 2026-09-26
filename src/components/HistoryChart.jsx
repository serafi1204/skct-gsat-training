import React, { useRef, useEffect } from 'react';
import { Chart } from 'chart.js/auto';

/**
 * 히스토리 추이 차트 (정답률 + 평균시간 이중 축)
 * @param {Object} props
 * @param {Array<{accuracy: number, averageTime: number}>} props.history
 */
const HistoryChart = ({ history, metric = 'accuracy', showTime = true, timeLabel = '평균 시간 (초)' }) => {
    const metricLabel = metric === 'averageTime' ? '전체 문항 평균 시간 (초)' : metric === 'averageErrorRate' ? '평균 오차율 (%, 낮을수록 좋음)' : metric === 'comparisonAccuracy' ? '증가율 비교 정답률 (%)' : '정답률 (%)';
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (history.length === 0) return;

        const displayHistory = history.slice(-20);
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: displayHistory.map((_, i) => `${i + 1}회`),
                datasets: [
                    {
                        label: metricLabel,
                        data: displayHistory.map((h) => h[metric] ?? null),
                        borderColor: '#0f766e',
                        backgroundColor: '#0f766e',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        borderWidth: 2,
                        yAxisID: 'y',
                        tension: 0.1,
                    },
                    ...(showTime ? [{
                        label: timeLabel,
                        data: displayHistory.map((h) => h.averageTime),
                        borderColor: '#8ca2a9',
                        backgroundColor: '#8ca2a9',
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                        tension: 0.1,
                    }] : []),
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#526870', usePointStyle: true } },
                    tooltip: { callbacks: { title: items => {
                        const record = displayHistory[items[0]?.dataIndex];
                        return record?.date ? `${record.date} · ${items[0].label}` : items[0]?.label;
                    } } },
                },
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        ...(['accuracy', 'comparisonAccuracy'].includes(metric) ? { max: 100 } : {}),
                        title: { display: true, text: metricLabel },
                    },
                    ...(showTime ? { y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: timeLabel },
                    } } : {}),
                },
            },
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [history, metric, metricLabel, showTime, timeLabel]);

    if (history.length === 0) return <p className="helper-text py-5">표시할 기록이 없습니다.</p>;
    return <div className="h-64 w-full">
        <canvas ref={chartRef} role="img" aria-label={`${metricLabel} 추이, 최근 ${Math.min(history.length, 20)}회 기록`} />
        <p className="sr-only">{history.slice(-20).map((record, index) => `${index + 1}회: ${record[metric] ?? '기록 없음'}${showTime ? `, 시간 ${record.averageTime ?? '기록 없음'}초` : ''}`).join('. ')}</p>
    </div>;
};

export default HistoryChart;

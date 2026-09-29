import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import ConfirmDialog from './ConfirmDialog.jsx';
import MockExamDialog from './MockExamDialog.jsx';
import { MOCK_EXAM_SECTIONS, analyzeMockExams } from '../utils/mockExamRecords.js';

const sectionColors = ['#0f766e', '#5378a9', '#8263a9', '#d19838', '#d06b62'];

function MockExamStackedChart({ records, focus, onSelect }) {
    const canvas = useRef(null);
    useEffect(() => {
        if (!records.length) return undefined;
        const stacked = focus === -1;
        const sectionIndexes = stacked ? MOCK_EXAM_SECTIONS.map((_, index) => index) : [focus];
        const recordBarLayers = {
            id: 'mockExamRecordBarLayers',
            beforeDatasetsDraw(chart) {
                const context = chart.ctx;
                const base = chart.scales.y.getPixelForValue(0);
                context.save();
                context.fillStyle = '#dce8e5';
                for (const [index, record] of records.entries()) {
                    const bar = chart.getDatasetMeta(0).data[index];
                    if (!bar) continue;
                    const attempted = stacked ? record.result.total.attempted : record.result.sections[focus].attempted;
                    const top = chart.scales.y.getPixelForValue(attempted);
                    context.fillRect(bar.x - bar.width / 2, top, bar.width, base - top);
                }
                context.restore();
            },
            afterDatasetsDraw(chart) {
                const context = chart.ctx;
                context.save();
                context.fillStyle = '#172b38';
                context.font = '700 11px sans-serif';
                context.textAlign = 'center';
                for (const [index, record] of records.entries()) {
                    const bar = chart.getDatasetMeta(0).data[index];
                    if (!bar) continue;
                    const value = stacked ? record.result.score : record.result.sections[focus].correct;
                    const attempted = stacked ? record.result.total.attempted : record.result.sections[focus].attempted;
                    const correctY = chart.scales.y.getPixelForValue(value) - 7;
                    const attemptedY = chart.scales.y.getPixelForValue(attempted) - 7;
                    const closeLabels = correctY - attemptedY < 16;
                    context.fillStyle = '#526770';
                    context.fillText(`풀이 ${attempted}`, bar.x, closeLabels ? attemptedY - 14 : attemptedY);
                    context.fillStyle = '#172b38';
                    context.fillText(`정답 ${value}`, bar.x, closeLabels ? attemptedY : correctY);
                }
                context.restore();
            },
        };
        const chart = new Chart(canvas.current, {
            type: 'bar',
            data: {
                labels: records.map(record => [record.date.slice(5).replace('-', '/'), record.name.length > 5 ? `${record.name.slice(0, 5)}…` : record.name]),
                datasets: sectionIndexes.map(index => ({
                    label: MOCK_EXAM_SECTIONS[index],
                    data: records.map(record => record.result.sections[index].correct),
                    backgroundColor: sectionColors[index],
                    barThickness: 34,
                })),
            },
            plugins: [recordBarLayers],
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                layout: { padding: { top: 34 } },
                interaction: { mode: 'index', intersect: false },
                onClick: (_, elements) => { if (elements.length) onSelect(records[elements[0].index].id); },
                scales: {
                    y: { stacked, min: 0, max: stacked ? 100 : 20, title: { display: true, text: stacked ? '총점 (100점)' : `${MOCK_EXAM_SECTIONS[focus]} 정답 수 (20점)` } },
                    x: { stacked: true, ticks: { autoSkip: false, maxRotation: 0 } },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: {
                        title: items => { const record = records[items[0]?.dataIndex]; return record ? `${record.date} · ${record.name}` : ''; },
                        label: item => {
                            const result = records[item.dataIndex]?.result.sections[sectionIndexes[item.datasetIndex]];
                            return `${item.dataset.label}: 정답 ${result.correct} · 풀이 ${result.attempted}`;
                        },
                        footer: items => {
                            const result = records[items[0]?.dataIndex]?.result;
                            return result ? [`총점 ${result.score}/100 · 풀이 ${result.total.attempted}`, '선택하면 상세 결과를 볼 수 있습니다.'] : '';
                        },
                    } },
                },
            },
        });
        return () => chart.destroy();
    }, [records, focus, onSelect]);
    return <div className="mock-exam-chart-scroll" tabIndex={0} role="region" aria-label="전체 기록 그래프, 가로 스크롤"><div className="mock-exam-chart" style={{ minWidth: records.length <= 3 ? '100%' : `${60 + records.length * 78}px` }}>
        <canvas ref={canvas} role="img" aria-label={focus === -1 ? '전체 모의고사의 날짜순 영역별 정답 수 누적 막대그래프. 연한 후방 막대는 푼 문항 수' : `전체 모의고사의 ${MOCK_EXAM_SECTIONS[focus]} 정답 수 막대그래프. 연한 후방 막대는 푼 문항 수`} />
    </div></div>;
}

export default function MockExamRecords({ records, onAdd, onUpdate, onDelete, saveStatus, saveError, onRetrySave }) {
    const [editor, setEditor] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [chartFocus, setChartFocus] = useState(-1);
    const detailRef = useRef(null);
    const analysis = useMemo(() => analyzeMockExams(records), [records]);
    const selected = analysis.sorted.find(record => record.id === selectedId);
    const edited = records.find(record => record.id === editor);
    const deleting = records.find(record => record.id === deletingId);
    const selectRecord = useCallback(id => {
        setSelectedId(id);
        requestAnimationFrame(() => {
            detailRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            detailRef.current?.focus({ preventScroll: true });
        });
    }, []);
    useEffect(() => {
        if (!selectedId) return;
        detailRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        detailRef.current?.focus({ preventScroll: true });
    }, [selectedId]);
    const newestFirst = [...analysis.sorted].reverse();
    const change = analysis.latest && analysis.previous ? analysis.latest.result.score - analysis.previous.result.score : null;
    const averageChange = analysis.earlierAverage === null ? null : Math.round((analysis.recentAverage - analysis.earlierAverage) * 10) / 10;
    const detailsButton = record => <button className="secondary-button" type="button" aria-label={record.name + ' 상세'} aria-pressed={selectedId === record.id} onClick={() => selectRecord(record.id)}>상세</button>;

    return <div className="mock-exam-page">
        <div className="mock-exam-title-row">
            <div className="mock-exam-intro"><h1>모의고사 기록 <small>{records.length}개</small></h1><p>풀이량과 정답 수의 변화를 확인하세요.</p></div>
            <button className="primary-button" type="button" onClick={() => setEditor('new')}>기록 추가</button>
        </div>
        <div className={'mock-exam-save-state ' + (saveStatus === 'error' ? 'has-error' : '')} role={saveStatus === 'error' ? 'alert' : 'status'}>
            {saveStatus === 'saving' ? '변경 내용을 저장 중입니다…' : saveStatus === 'error' ? '저장하지 못했습니다. 입력한 기록은 화면에 남아 있습니다.' : '모든 변경 내용이 저장되었습니다.'}
            {saveStatus === 'error' && <><span>{saveError}</span><button type="button" className="text-button" onClick={onRetrySave}>다시 저장</button></>}
        </div>
        {records.length === 0 ? <section className="surface mock-exam-empty"><h2>첫 모의고사를 기록해 보세요.</h2><p>기록 추가에서 이름·날짜·답안 TXT를 입력하면 성적 비교가 시작됩니다.</p></section> : <>
            <div className={'mock-exam-metrics ' + (records.length === 1 ? 'two-metrics' : '')}>
                <div className="surface"><span>최근 점수</span><strong>{analysis.latest.result.score}<small> / 100</small></strong><small>{analysis.latest.date} · {analysis.latest.name}</small><small>{change === null ? '첫 기록' : '직전 대비 ' + (change > 0 ? '+' : '') + change + '점'}</small></div>
                {records.length > 1 && <div className="surface"><span>최근 {analysis.recentCount}회 평균</span><strong>{analysis.recentAverage}<small> / 100</small></strong><small>{averageChange === null ? '6회부터 이전 3회 평균과 비교합니다.' : '이전 3회 대비 ' + (averageChange > 0 ? '+' : '') + averageChange + '점'}</small></div>}
                <div className="surface"><span>최근 낮은 점수 영역</span><strong className="metric-name">{analysis.weakest.score === 20 ? '모든 영역 만점' : analysis.weakestSections.map(section => section.name).join(' · ')}</strong><small>최근 {analysis.recentCount}회 평균 {analysis.weakest.score} / 20</small>{analysis.weakestSections.length === 1 && <small>{analysis.weakest.cause} · 오답 {analysis.weakest.wrong} · 미풀이 {analysis.weakest.unanswered}</small>}</div>
            </div>
            <section className="surface mock-exam-analysis"><h2>전체 기록 비교</h2>
                <div className="mock-exam-chart-modes" role="group" aria-label="그래프 표시 영역">
                    <button type="button" aria-pressed={chartFocus === -1} onClick={() => setChartFocus(-1)}>전체</button>
                    {MOCK_EXAM_SECTIONS.map((section, index) => <button key={section} type="button" aria-pressed={chartFocus === index} onClick={() => setChartFocus(index)}>{section}</button>)}
                </div>
                <div className="mock-exam-chart-key"><span className="mock-exam-chart-swatch" aria-hidden="true" />푼 문항<span>색 막대: 정답</span></div>
                <MockExamStackedChart records={analysis.sorted} focus={chartFocus} onSelect={selectRecord} />
                <div className="mock-exam-legend">{MOCK_EXAM_SECTIONS.map((section, index) => (chartFocus === -1 || chartFocus === index) && <span key={section}><i style={{ background: sectionColors[index] }} />{section}</span>)}</div>
                <p>전체 기록을 날짜순으로 표시합니다. 막대나 목록의 상세 버튼을 선택하면 결과를 확인할 수 있습니다.</p>
            </section>
            {selected && <section className="surface mock-exam-analysis mock-exam-detail" ref={detailRef} tabIndex={-1} aria-label="선택한 기록 상세">
                <div className="mock-exam-detail-heading"><div><h2>{selected.name}</h2><p>{selected.date} · 정답 {selected.result.score}/100 · 풀이 {selected.result.total.attempted}</p></div><button className="text-button" type="button" onClick={() => setSelectedId(null)}>상세 닫기</button></div>
                <table className="mock-exam-detail-table"><thead><tr><th scope="col">영역</th><th scope="col">풀이</th><th scope="col">정답</th><th scope="col">오답</th><th scope="col">미풀이</th></tr></thead>
                    <tbody>{selected.result.sections.map((section, index) => <tr key={index}><th scope="row">{MOCK_EXAM_SECTIONS[index]}</th><td>{section.attempted}</td><td>{section.correct}</td><td>{section.wrong}</td><td>{section.unanswered}</td></tr>)}</tbody>
                    <tfoot><tr><th scope="row">전체</th><td>{selected.result.total.attempted}</td><td>{selected.result.total.correct}</td><td>{selected.result.total.wrong}</td><td>{selected.result.total.unanswered}</td></tr></tfoot>
                </table>
                <div className="mock-exam-form-actions"><button className="secondary-button" type="button" onClick={() => setEditor(selected.id)}>수정</button><button className="text-button danger" type="button" onClick={() => setDeletingId(selected.id)}>삭제</button></div>
            </section>}
            <section className="surface mock-exam-analysis"><h2>영역별 최근 성적 <small>최근 {analysis.recentCount}회 평균 · 20문항</small></h2>
                <div className="mock-exam-chart-key"><span className="mock-exam-chart-swatch" aria-hidden="true" />푼 문항<span>색 막대: 정답</span></div>
                <div className="mock-exam-section-bars">{analysis.sectionAverages.map((section, index) => <div key={section.name} className="mock-exam-section-row">
                    <span>{section.name}</span><div className="mock-exam-section-track" role="img" aria-label={`${section.name}: 풀이 ${section.attempted}, 정답 ${section.score}, 20문항 기준`}>
                        <span className="mock-exam-section-attempted" style={{ width: section.attempted / 20 * 100 + '%' }} />
                        <span className="mock-exam-section-correct" style={{ width: section.score / 20 * 100 + '%', background: sectionColors[index] }} />
                    </div><strong>{section.score} / 20</strong>
                    <small>풀이 {section.attempted} · 오답 {section.wrong} · 미풀이 {section.unanswered}</small>
                </div>)}</div>
            </section>
            <section className="surface mock-exam-analysis"><h2>기록 목록 <small>{records.length}개 · 최신순</small></h2>
                <div className="mock-exam-table-wrap" role="region" aria-label="기록 목록 표, 좁은 화면에서는 가로 스크롤" tabIndex={0}><table className="mock-exam-table"><thead><tr><th scope="col">날짜</th><th scope="col">이름</th><th scope="col">정답/100</th><th scope="col">풀이</th><th scope="col">오답</th><th scope="col">미풀이</th><th scope="col">보기</th></tr></thead>
                    <tbody>{newestFirst.map(record => <tr key={record.id} className={record.id === selectedId ? 'is-selected' : ''}>
                        <td>{record.date}</td><th scope="row">{record.name}</th><td>{record.result.score}/100</td><td>{record.result.total.attempted}</td><td>{record.result.total.wrong}</td><td>{record.result.total.unanswered}</td><td>{detailsButton(record)}</td>
                    </tr>)}</tbody></table></div>
            </section>
        </>}
        {(editor === 'new' || edited) && <MockExamDialog key={editor} record={edited} onClose={() => setEditor(null)}
            onSave={input => {
                if (edited) onUpdate(edited.id, input);
                else onAdd(input);
                setEditor(null);
            }} />}
        {deleting && <ConfirmDialog title="모의고사 기록을 삭제할까요?" description={deleting.name + ' (' + deleting.date + ') 기록이 삭제됩니다. 되돌릴 수 없습니다.'}
            confirmLabel="삭제" destructive onCancel={() => setDeletingId(null)} onConfirm={() => { onDelete(deleting.id); if (selectedId === deleting.id) setSelectedId(null); setDeletingId(null); }} />}
    </div>;
}

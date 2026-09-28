import React, { useState } from 'react';
import HistoryChart from './HistoryChart';
import CalculationHistory from './CalculationHistory';
import DailyTodo from './DailyTodo';
import PracticeTools from './PracticeTools';
import { aggregateDailyHistory } from '../utils/dailyHistory.js';

const modes = [
    { id: 'TABLE', name: '자료 읽기', icon: '▤' },
    { id: 'PATTERN', name: '규칙 찾기', icon: '◇' },
    { id: 'SEQUENCE', name: '수열추리', icon: '↗' },
    { id: 'ADDITION', name: '계산 훈련', icon: '∑' },
];

const settingOptions = {
    TABLE: [
        ['tablePlotPercent', '그래프 출제 비율', [0, 25, 50, 75, 100], '%'],
        ['tableMin', '표 숫자 최솟값', [100, 500, 1000, 2000, 3000, 4000]],
        ['tableMax', '표 숫자 최댓값', [5000, 7000, 9000, 9999]],
        ['plotMin', '그래프 숫자 최솟값', [100, 500, 1100, 2000, 3000]],
        ['plotMax', '그래프 숫자 최댓값', [7000, 8000, 8600, 9000, 9999]],
    ],
    PATTERN: [['patternSubstitutionPercent', '치환 문제 출제 비율', [0, 10, 15, 25, 50, 100], '%']],
    SEQUENCE: [['sequenceMax', '수열 숫자 최댓값', [300, 500, 750, 999]]],
    ADDITION: [
        ['calculationMin', '계산 숫자 최솟값', [100, 500, 1000, 2000, 3000]],
        ['calculationMax', '계산 숫자 최댓값', [7000, 8000, 9000, 9999]],
    ],
};

const modeHistory = (history, mode) => history.filter(record => mode === 'TABLE'
    ? ['TABLE', 'PLOT'].includes(record.examType)
    : record.examType === mode);

export default function StartScreen({ preferences, onPreferenceChange, onStart, history, onClearHistory, timers, onTimerAction }) {
    const [activeTab, setActiveTab] = useState('training');
    const { examType, totalRounds, problemCount } = preferences;
    const selectedMode = modes.find(mode => mode.id === examType);
    const selectedHistory = modeHistory(history, examType);
    const dailyHistory = aggregateDailyHistory(selectedHistory).slice(-20);
    const count = examType === 'TABLE' ? totalRounds : problemCount;
    const countKey = examType === 'TABLE' ? 'totalRounds' : 'problemCount';
    const chartTimeLabel = examType === 'TABLE' ? '세트당 평균 시간 (초)' : examType === 'PATTERN' ? '전체 소요 시간 (초)' : '문항당 평균 시간 (초)';

    return (
        <div className="app-shell">
            <header className="site-header">
                <div className="site-header-inner">
                    <div className="brand-lockup"><span className="brand-mark">S</span><span>SKCT 연습실</span></div>
                    <nav className="main-tabs" role="tablist" aria-label="메인 화면">
                        <button type="button" role="tab" id="training-tab" aria-controls="training-panel" aria-selected={activeTab === 'training'} onClick={() => setActiveTab('training')}>훈련</button>
                        <button type="button" role="tab" id="tools-tab" aria-controls="tools-panel" aria-selected={activeTab === 'tools'} onClick={() => setActiveTab('tools')}>풀이 도구</button>
                    </nav>
                </div>
            </header>

            <main className="dashboard-layout" id="training-panel" role="tabpanel" aria-labelledby="training-tab" hidden={activeTab !== 'training'}>
                <aside className="dashboard-sidebar" aria-label="오늘의 Todo와 훈련 선택">
                    <DailyTodo modes={modes} />
                    <section className="mode-section" aria-labelledby="mode-heading">
                        <div className="section-heading"><h2 id="mode-heading">훈련 유형</h2></div>
                        <div className="mode-list">
                            {modes.map(mode => <button key={mode.id} type="button"
                                className={`mode-card ${examType === mode.id ? 'selected' : ''}`}
                                aria-pressed={examType === mode.id}
                                onClick={() => onPreferenceChange('examType', mode.id)}>
                                <span className="mode-icon" aria-hidden="true">{mode.icon}</span>
                                <strong>{mode.name}</strong>
                                <span className="mode-check" aria-hidden="true">{examType === mode.id ? '✓' : ''}</span>
                            </button>)}
                        </div>
                    </section>
                </aside>

                <div className="dashboard-main">
                    <section className="surface setup-panel" aria-labelledby="setup-heading">
                        <div className="section-heading"><h2 id="setup-heading">{selectedMode.name} 설정</h2></div>
                        <div className="setup-row">
                            <h3>{examType === 'TABLE' ? '세트 수' : '문제 수'}</h3>
                            <div className="count-options" role="group" aria-label={examType === 'TABLE' ? '세트 수' : '문제 수'}>
                                {[5, 10, 20, 30].map(value => <button key={value} type="button" aria-pressed={count === value}
                                    className={count === value ? 'selected' : ''} onClick={() => onPreferenceChange(countKey, value)}>{value}</button>)}
                            </div>
                        </div>
                        {examType === 'ADDITION' && <div className="setup-row">
                            <h3>계산기 사용</h3>
                            <label className="calculator-option">
                                <input type="checkbox" checked={preferences.calculatorUsed} onChange={event => onPreferenceChange('calculatorUsed', event.target.checked)} />
                                <span>{preferences.calculatorUsed ? '사용' : '미사용'}</span>
                            </label>
                        </div>}
                        <details className="advanced-settings">
                            <summary>상세 설정</summary>
                            <div className="settings-grid">
                                {settingOptions[examType].map(([key, label, options, suffix = '']) => <label key={key} className="field-label">
                                    <span>{label}</span>
                                    <select value={preferences[key]} onChange={event => onPreferenceChange(key, Number(event.target.value))}>
                                        {options.map(value => <option key={value} value={value}>{value}{suffix}</option>)}
                                    </select>
                                </label>)}
                            </div>
                        </details>
                        <button type="button" className="primary-button start-button" onClick={onStart}>{selectedMode.name} 시작 <span aria-hidden="true">→</span></button>
                    </section>

                    <section className="surface history-panel" aria-labelledby="history-heading">
                        <div className="section-heading"><h2 id="history-heading">{selectedMode.name} 기록</h2><button type="button" className="text-button danger" onClick={onClearHistory} disabled={history.length === 0}>전체 기록 초기화</button></div>
                        {selectedHistory.length === 0 ? <p className="helper-text history-empty">기록 없음</p> : <>
                            <div className="chart-area">{examType === 'ADDITION' ? <CalculationHistory history={dailyHistory} /> : <HistoryChart history={dailyHistory} timeLabel={chartTimeLabel} compact />}</div>
                        </>}
                    </section>
                </div>
            </main>
            <main className="tools-main" id="tools-panel" role="tabpanel" aria-labelledby="tools-tab" hidden={activeTab !== 'tools'}>
                <PracticeTools active={activeTab === 'tools'} timers={timers} onTimerAction={onTimerAction} />
            </main>
        </div>
    );
}

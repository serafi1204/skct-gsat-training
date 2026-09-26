import React, { useState } from 'react';
import HistoryChart from './HistoryChart';
import CalculationHistory from './CalculationHistory';

const modes = [
    { id: 'TABLE', name: '자료 읽기', subtitle: '표 · 선 그래프', description: '항목과 수치를 빠르게 찾아 정확히 입력합니다.', icon: '▤' },
    { id: 'PATTERN', name: '규칙 찾기', subtitle: '기호 · 변환', description: '제시된 변환 규칙을 읽고 빈칸을 채웁니다.', icon: '◇' },
    { id: 'SEQUENCE', name: '수열추리', subtitle: '숫자 규칙', description: '수열의 흐름을 파악하고 다음 수를 찾습니다.', icon: '↗' },
    { id: 'ADDITION', name: '계산 훈련', subtitle: '평균 · 합 · 증가율 · 비율', description: '암산과 수치 판단을 반복해서 연습합니다.', icon: '∑' },
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

export default function StartScreen({ preferences, onPreferenceChange, onStart, history, onClearHistory }) {
    const [view, setView] = useState('practice');
    const [historyMode, setHistoryMode] = useState(preferences.examType);
    const { examType, totalRounds, problemCount } = preferences;
    const selectedMode = modes.find(mode => mode.id === examType);
    const selectedHistory = modeHistory(history, historyMode);
    const count = examType === 'TABLE' ? totalRounds : problemCount;
    const countKey = examType === 'TABLE' ? 'totalRounds' : 'problemCount';
    const timeLabel = historyMode === 'TABLE' ? '최근 세트당 시간' : historyMode === 'PATTERN' ? '최근 전체 소요 시간' : '최근 문항당 시간';
    const chartTimeLabel = historyMode === 'TABLE' ? '세트당 평균 시간 (초)' : historyMode === 'PATTERN' ? '전체 소요 시간 (초)' : '문항당 평균 시간 (초)';

    return (
        <div className="app-shell">
            <header className="site-header">
                <div className="site-header-inner">
                    <div className="brand-lockup"><span className="brand-mark">S</span><span>SKCT 연습실</span></div>
                    <nav className="top-nav" aria-label="화면 선택">
                        <button type="button" className={view === 'practice' ? 'active' : ''} onClick={() => setView('practice')}>훈련 시작</button>
                        <button type="button" className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>내 기록{history.length > 0 ? <span className="nav-count">{history.length}</span> : null}</button>
                    </nav>
                </div>
            </header>

            <main className="home-container">
                {view === 'practice' ? <>
                    <div className="home-intro">
                        <span className="eyebrow">짧게, 꾸준히, 정확하게</span>
                        <h1>오늘 연습할 유형을 고르세요</h1>
                        <p>반복 훈련에 집중할 수 있도록 문제 수를 정하고 바로 시작하세요.</p>
                    </div>
                    <section aria-labelledby="mode-heading">
                        <div className="section-heading"><h2 id="mode-heading">훈련 유형</h2><span>4가지 유형</span></div>
                        <div className="mode-grid">
                            {modes.map(mode => <button key={mode.id} type="button"
                                className={`mode-card ${examType === mode.id ? 'selected' : ''}`}
                                aria-pressed={examType === mode.id}
                                onClick={() => onPreferenceChange('examType', mode.id)}>
                                <span className="mode-card-top"><span className="mode-icon" aria-hidden="true">{mode.icon}</span><span className="mode-check" aria-hidden="true">{examType === mode.id ? '✓' : ''}</span></span>
                                <strong>{mode.name}</strong><small>{mode.subtitle}</small><span className="mode-description">{mode.description}</span>
                            </button>)}
                        </div>
                    </section>

                    <section className="surface setup-panel" aria-labelledby="setup-heading">
                        <div className="section-heading"><div><span className="eyebrow">시작 설정</span><h2 id="setup-heading">{selectedMode.name} 준비</h2></div><span>설정은 자동 저장됩니다</span></div>
                        <div className="setup-row">
                            <div><h3>{examType === 'TABLE' ? '세트 수' : '문제 수'}</h3><p>{examType === 'TABLE' ? '한 세트에 4문항이 포함됩니다.' : '원하는 만큼 반복해 보세요.'}</p></div>
                            <div className="count-options" role="group" aria-label={examType === 'TABLE' ? '세트 수' : '문제 수'}>
                                {[5, 10, 20, 30].map(value => <button key={value} type="button" aria-pressed={count === value}
                                    className={count === value ? 'selected' : ''} onClick={() => onPreferenceChange(countKey, value)}>{value}</button>)}
                            </div>
                        </div>
                        <details className="advanced-settings">
                            <summary>문제 생성 상세 설정 <span>유형별 숫자 범위와 출제 비율</span></summary>
                            <div className="settings-grid">
                                {settingOptions[examType].map(([key, label, options, suffix = '']) => <label key={key} className="field-label">
                                    <span>{label}</span>
                                    <select value={preferences[key]} onChange={event => onPreferenceChange(key, Number(event.target.value))}>
                                        {options.map(value => <option key={value} value={value}>{value}{suffix}</option>)}
                                    </select>
                                </label>)}
                            </div>
                            {examType === 'TABLE' && <p className="helper-text">그래프 숫자는 선과 라벨이 겹치지 않도록 설정 범위 안에서 생성됩니다.</p>}
                        </details>
                        <button type="button" className="primary-button start-button" onClick={onStart}>{selectedMode.name} 시작 <span aria-hidden="true">→</span></button>
                    </section>
                    <p className="home-footnote">정답과 소요 시간은 훈련 종료 후 확인할 수 있습니다. 기록은 이 브라우저에 저장됩니다.</p>
                </> : <>
                    <div className="home-intro compact"><span className="eyebrow">학습 기록</span><h1>내 기록 돌아보기</h1><p>최근 변화와 유형별 정확도를 확인하세요.</p></div>
                    <section className="surface history-panel" aria-label="훈련 기록">
                        <div className="section-heading"><h2>유형별 기록</h2><button type="button" className="text-button danger" onClick={onClearHistory} disabled={history.length === 0}>전체 기록 초기화</button></div>
                        <div className="history-tabs" role="group" aria-label="기록 유형">
                            {modes.map(mode => <button key={mode.id} type="button" className={historyMode === mode.id ? 'active' : ''} aria-pressed={historyMode === mode.id} onClick={() => setHistoryMode(mode.id)}>{mode.name}</button>)}
                        </div>
                        {selectedHistory.length === 0 ? <div className="empty-state"><span aria-hidden="true">◌</span><h3>아직 기록이 없습니다</h3><p>이 유형을 한 번 연습하면 변화가 여기에 표시됩니다.</p><button type="button" className="secondary-button" onClick={() => { onPreferenceChange('examType', historyMode); setView('practice'); }}>이 유형 연습하기</button></div> : <>
                            <div className="history-summary"><div><span>완료한 훈련</span><strong>{selectedHistory.length}회</strong></div><div><span>{timeLabel}</span><strong>{selectedHistory.at(-1)?.averageTime ?? '—'}초</strong></div></div>
                            <div className="chart-area">{historyMode === 'ADDITION' ? <CalculationHistory history={selectedHistory} /> : <HistoryChart history={selectedHistory} timeLabel={chartTimeLabel} />}</div>
                            <p className="helper-text">그래프에는 최근 20회 기록이 표시됩니다.</p>
                        </>}
                    </section>
                </>}
                {view === 'practice' && <button type="button" className="text-button reset-link" onClick={onClearHistory} disabled={history.length === 0}>전체 기록 초기화</button>}
            </main>
        </div>
    );
}

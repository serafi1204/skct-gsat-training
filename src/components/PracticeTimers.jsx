import React, { useEffect, useRef } from 'react';
import { formatTimer } from '../utils/practiceTimers.js';

const timerLabels = { fifteen: '15분', one: '1분' };

export function PracticeTimers({ timers, onAction }) {
    return <section className="surface tool-timers" aria-label="타이머">
        <h2>타이머</h2>
        {Object.entries(timerLabels).map(([id, label]) => {
            const timer = timers[id];
            const running = timer.endsAt !== null;
            return <div className={`timer-row ${timer.complete ? 'timer-complete' : ''}`} key={id}>
                <span className="timer-label">{label}</span>
                <span className="timer-time" role="timer" aria-label={`${label} 타이머 ${timer.complete ? '완료' : `${formatTimer(timer.remainingMs)} 남음`}`}>{timer.complete ? '완료' : formatTimer(timer.remainingMs)}</span>
                <button type="button" onClick={() => onAction(id, running ? 'pause' : 'start')} aria-label={`${label} 타이머 ${running ? '일시정지' : '시작'}`}>
                    {running ? '일시정지' : '시작'}
                </button>
                <button type="button" onClick={() => onAction(id, 'reset')} aria-label={`${label} 타이머 초기화`}>초기화</button>
            </div>;
        })}
    </section>;
}

export function TimerAlert({ completed, onDismiss }) {
    const dismissRef = useRef(null);
    useEffect(() => { dismissRef.current?.focus(); }, []);
    return <div className="timer-alert-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="timer-alert-title">
        <div className="timer-alert-content">
            <h2 id="timer-alert-title">{completed.map(id => timerLabels[id]).join('·')} 타이머 완료</h2>
            <p>설정한 시간이 끝났습니다.</p>
            <button type="button" ref={dismissRef} onClick={onDismiss}>확인</button>
        </div>
    </div>;
}

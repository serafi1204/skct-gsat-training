import React from 'react';

export default function PracticeHeader({ title, current, total, caption, onExit }) {
    const completed = Math.max(0, current - 1);
    const progress = total > 0 ? Math.min(100, completed / total * 100) : 0;
    return <header className="practice-header">
        <div className="practice-topline"><span className="practice-kicker">{caption || 'SKCT PRACTICE'}</span>{onExit && <button type="button" className="text-button" onClick={onExit}>훈련 그만두기</button>}</div>
        <div className="practice-title-row"><h1>{title}</h1><span aria-live="polite">{current} / {total}</span></div>
        <div className="progress-track" role="progressbar" aria-label="완료한 단계" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${progress}%` }} /></div>
    </header>;
}

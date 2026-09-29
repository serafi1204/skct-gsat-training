import React, { useState } from 'react';
import { localDateKey } from '../utils/dailyTodo.js';
import { normalizeOmrText } from '../utils/omrText.js';
import { validateMockExamInput } from '../utils/mockExamRecords.js';

export default function MockExamForm({ title, source, record, includeText = true, onSave, onCancel }) {
    const [name, setName] = useState(record?.name ?? '');
    const [date, setDate] = useState(record?.date ?? localDateKey());
    const [answers, setAnswers] = useState(record?.answers ?? '');
    const [correct, setCorrect] = useState(record?.correct ?? '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const submit = event => {
        event.preventDefault();
        const input = {
            name: name.trim(), date,
            answers: includeText ? answers : source.answers,
            correct: includeText ? correct : source.correct,
        };
        const problem = validateMockExamInput(input);
        if (problem) { setError(problem); setMessage(''); return; }
        onSave(input);
        setError('');
        setMessage('기록에 추가했습니다.');
        if (!record) {
            setName('');
            if (includeText) { setAnswers(''); setCorrect(''); }
        }
    };

    return <form className="surface mock-exam-form" onSubmit={submit}>
        <h2>{title}</h2>
        <div className="mock-exam-meta">
            <label>기록 이름<input type="text" value={name} maxLength={80} onChange={event => { setName(event.target.value); setMessage(''); }} placeholder="예: SKCT 실전 모의고사 1회" required /></label>
            <label>날짜<input type="date" value={date} onChange={event => { setDate(event.target.value); setMessage(''); }} required /></label>
        </div>
        {includeText && <div className="mock-exam-texts">
            <label>내 답안 TXT <small>0 = 미풀이</small><textarea value={answers} onChange={event => { setAnswers(normalizeOmrText(event.target.value)); setMessage(''); }} inputMode="numeric" spellCheck={false} placeholder="20자리씩 입력" aria-label="모의고사 내 답안 TXT" /></label>
            <label>정답 TXT <small>100문항 모두 1~5 필수</small><textarea value={correct} onChange={event => { setCorrect(normalizeOmrText(event.target.value)); setMessage(''); }} inputMode="numeric" spellCheck={false} placeholder="20자리씩 입력" aria-label="모의고사 정답 TXT" /></label>
        </div>}
        {error && <p className="mock-exam-error" role="alert">{error}</p>}
        {message && <p className="mock-exam-success" role="status">{message}</p>}
        <div className="mock-exam-form-actions">
            {onCancel && <button type="button" className="secondary-button" onClick={onCancel}>취소</button>}
            <button type="submit" className="primary-button">{record ? '수정 저장' : '모의고사 기록 추가'}</button>
        </div>
    </form>;
}

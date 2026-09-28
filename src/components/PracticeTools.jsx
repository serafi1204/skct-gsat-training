import React, { useEffect, useRef, useState } from 'react';
import { calculatorExpression, calculatorInput, initialCalculator } from '../utils/practiceCalculator.js';
import { formatOmrText, normalizeOmrText, parseOmrText, summarizeOmrAnswers } from '../utils/omrText.js';
import { loadOmrText, saveOmrText } from '../utils/omrStorage.js';
import { PracticeTimers } from './PracticeTimers.jsx';

const calculatorKeys = [
    ['C', 'C'], ['⌫', 'Backspace'], ['÷', '/'], ['×', '*'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['−', '-'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['+', '+'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['=', '='],
    ['0', '0'], ['.', '.'],
];
const omrSections = ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'];

function ScratchPad() {
    const [mode, setMode] = useState('memo');
    const [memo, setMemo] = useState('');
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const previous = useRef(null);

    const point = event => {
        const canvas = canvasRef.current;
        const bounds = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - bounds.left) * canvas.width / bounds.width,
            y: (event.clientY - bounds.top) * canvas.height / bounds.height,
        };
    };

    const startDrawing = event => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        const canvas = canvasRef.current;
        canvas.setPointerCapture(event.pointerId);
        drawing.current = true;
        previous.current = point(event);
        const context = canvas.getContext('2d');
        context.save();
        context.fillStyle = '#172b38';
        context.beginPath();
        context.arc(previous.current.x, previous.current.y, 1, 0, Math.PI * 2);
        context.fill();
        context.restore();
    };

    const draw = event => {
        if (!drawing.current) return;
        const canvas = canvasRef.current;
        const next = point(event);
        const context = canvas.getContext('2d');
        context.save();
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = '#172b38';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(previous.current.x, previous.current.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        context.restore();
        previous.current = next;
    };

    const stopDrawing = () => {
        drawing.current = false;
        previous.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    };

    return <section className="surface tool-pad" aria-label="메모장과 그림판">
        <div className="tool-header">
            <div className="tool-switch" role="tablist" aria-label="필기 도구">
                <button type="button" role="tab" aria-selected={mode === 'memo'} onClick={() => setMode('memo')}>메모장</button>
                <button type="button" role="tab" aria-selected={mode === 'paint'} onClick={() => setMode('paint')}>그림판</button>
            </div>
            {mode === 'paint' && <div className="tool-actions">
                <button type="button" onClick={clearCanvas}>초기화</button>
            </div>}
        </div>
        <div className="tool-pad-content">
            <textarea aria-label="메모장" className="tool-memo" value={memo} onChange={event => setMemo(event.target.value)} hidden={mode !== 'memo'} spellCheck={false} />
            <canvas ref={canvasRef} width={600} height={496} aria-label="그림판" className="tool-canvas" hidden={mode !== 'paint'}
                onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} />
        </div>
    </section>;
}

function Calculator({ active }) {
    const [state, setState] = useState({ ...initialCalculator });
    const input = key => setState(current => calculatorInput(current, key));

    useEffect(() => {
        if (!active) return undefined;
        const onKeyDown = event => {
            if (event.target instanceof HTMLElement && (event.target.matches('input, textarea, select') || event.target.isContentEditable || (event.key === 'Enter' && event.target.closest('button')))) return;
            const key = event.key === 'Enter' ? '=' : event.key === 'Escape' || event.key.toLowerCase() === 'c' ? 'C' : event.key;
            if (!/^[0-9.+\-*/=]$/.test(key) && !['Backspace', 'C'].includes(key)) return;
            event.preventDefault();
            input(key);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [active]);

    return <section className="surface tool-calculator" aria-label="계산기">
        <div className="calculator-display" aria-live="polite">
            <div className="calculator-previous">{state.previousResult || '\u00a0'}</div>
            <div className="calculator-expression">{calculatorExpression(state) || '\u00a0'}</div>
            <div className="calculator-current">{state.evaluated ? `ANS=${state.display}` : state.display}</div>
        </div>
        <div className="calculator-keys">
            {calculatorKeys.map(([label, key]) => <button key={key} type="button" onClick={event => { input(key); event.currentTarget.blur(); }}
                className={`${key === '=' ? 'equals' : ''} ${key === '0' ? 'zero' : ''} ${['+', '-', '*', '/'].includes(key) ? 'operator' : ''}`}
                aria-label={key === 'Backspace' ? '한 글자 지우기' : key === 'C' ? '전체 지우기' : label}>{label}</button>)}
        </div>
    </section>;
}

function AnswerSheet({ answers, correctAnswers, onSelectAnswer }) {
    const [activeSection, setActiveSection] = useState(0);

    return <section className="surface tool-answer-sheet" aria-label="OMR 답안지">
        <div className="omr-tabs" role="tablist" aria-label="OMR 영역" onKeyDown={event => {
            const next = event.key === 'ArrowRight' ? (activeSection + 1) % omrSections.length
                : event.key === 'ArrowLeft' ? (activeSection + omrSections.length - 1) % omrSections.length
                    : event.key === 'Home' ? 0 : event.key === 'End' ? omrSections.length - 1 : null;
            if (next === null) return;
            event.preventDefault();
            setActiveSection(next);
            event.currentTarget.querySelectorAll('[role="tab"]')[next].focus();
        }}>
            {omrSections.map((section, index) => <button key={section} type="button" role="tab"
                id={`omr-tab-${index}`} aria-controls="omr-panel" aria-selected={activeSection === index}
                aria-label={section} tabIndex={activeSection === index ? 0 : -1} onClick={() => setActiveSection(index)}>
                <span aria-hidden="true">{section.slice(0, 2)}<br />{section.slice(2)}</span>
            </button>)}
        </div>
        <div className="omr-scroll" id="omr-panel" role="tabpanel" aria-labelledby={`omr-tab-${activeSection}`}>
            {Array.from({ length: 20 }, (_, offset) => {
                const question = activeSection * 20 + offset;
                const result = answers[question] && correctAnswers[question]
                    ? (answers[question] === correctAnswers[question] ? 'correct' : 'incorrect') : '';
                return <div className={`omr-row ${Math.floor(question / 5) % 2 === 1 ? 'shaded' : ''}`} key={question}>
                    <span className="omr-number">{question + 1}</span>
                    <div className="omr-choices" role="group" aria-label={`${question + 1}번 답안`}>
                        {[1, 2, 3, 4, 5].map(choice => {
                            const selected = answers[question] === choice;
                            const answerKey = result === 'incorrect' && correctAnswers[question] === choice;
                            return <button key={choice} type="button"
                                className={[selected && 'selected', selected && result, answerKey && 'answer-key'].filter(Boolean).join(' ')}
                                aria-label={`${question + 1}번 ${choice}번 선택${answerKey ? ', 실제 정답' : selected && result ? `, ${result === 'correct' ? '정답' : '오답'}` : ''}`}
                                aria-pressed={selected}
                                onClick={() => onSelectAnswer(question, choice)}>{choice}</button>;
                        })}
                    </div>
                </div>;
            })}
        </div>
    </section>;
}

function AnswerTextFields({ answerText, correctText, onAnswerTextChange, onCorrectTextChange }) {
    return <section className="surface omr-text-panel" aria-label="답안 TXT 입력">
        <label>
            <span>내 답안 TXT <small>0 = 미선택</small></span>
            <textarea value={answerText} onChange={event => onAnswerTextChange(event.target.value)}
                inputMode="numeric" spellCheck={false} aria-label="내 답안 TXT" placeholder="20자리씩 입력" />
        </label>
        <label>
            <span>정답 TXT <small>0 = 미입력</small></span>
            <textarea value={correctText} onChange={event => onCorrectTextChange(event.target.value)}
                inputMode="numeric" spellCheck={false} aria-label="정답 TXT" placeholder="20자리씩 입력" />
        </label>
    </section>;
}

function AnswerSummary({ answers, correctAnswers }) {
    const { sections, total } = summarizeOmrAnswers(answers, correctAnswers);
    const ungraded = total.solved - total.correct - total.incorrect;

    return <section className="surface omr-summary" aria-labelledby="omr-summary-heading">
        <h2 id="omr-summary-heading">풀이 결과</h2>
        <table>
            <thead><tr><th scope="col">세션</th><th scope="col">푼 개수</th><th scope="col">정답개수</th><th scope="col">오답개수</th></tr></thead>
            <tbody>{sections.map((counts, index) => <tr key={omrSections[index]}>
                <th scope="row">{omrSections[index]}</th><td>{counts.solved}</td><td>{counts.correct}</td><td>{counts.incorrect}</td>
            </tr>)}</tbody>
            <tfoot><tr><th scope="row">종합</th><td>{total.solved}</td><td>{total.correct}</td><td>{total.incorrect}</td></tr></tfoot>
        </table>
        {ungraded > 0 && <p>정답이 입력되지 않은 {ungraded}문항은 정답·오답 집계에서 제외했습니다.</p>}
    </section>;
}

export function PracticeToolStack({ active, timers, onTimerAction, showTimers = true }) {
    return <div className="tools-stack">
        {showTimers && <PracticeTimers timers={timers} onAction={onTimerAction} />}
        <ScratchPad />
        <Calculator active={active} />
    </div>;
}

export default function PracticeTools({ active, timers, onTimerAction }) {
    const [answerText, setAnswerText] = useState(() => loadOmrText('answers'));
    const [answers, setAnswers] = useState(() => parseOmrText(answerText));
    const [correctText, setCorrectText] = useState(() => loadOmrText('correct'));
    const correctAnswers = parseOmrText(correctText);

    useEffect(() => { saveOmrText('answers', answerText); }, [answerText]);
    useEffect(() => { saveOmrText('correct', correctText); }, [correctText]);

    const selectAnswer = (question, choice) => {
        const next = answers.map((answer, index) => index === question ? (answer === choice ? null : choice) : answer);
        setAnswers(next);
        setAnswerText(formatOmrText(next));
    };

    const changeAnswerText = value => {
        const next = normalizeOmrText(value);
        setAnswerText(next);
        setAnswers(parseOmrText(next));
    };

    return <div className="tools-page">
        <PracticeTimers timers={timers} onAction={onTimerAction} wide />
        <div className="tools-row">
            <AnswerSheet answers={answers} correctAnswers={correctAnswers} onSelectAnswer={selectAnswer} />
            <PracticeToolStack active={active} timers={timers} onTimerAction={onTimerAction} showTimers={false} />
        </div>
        <AnswerTextFields answerText={answerText} correctText={correctText}
            onAnswerTextChange={changeAnswerText} onCorrectTextChange={value => setCorrectText(normalizeOmrText(value))} />
        <AnswerSummary answers={answers} correctAnswers={correctAnswers} />
    </div>;
}

import React, { useEffect, useRef, useState } from 'react';
import { calculatorExpression, calculatorInput, initialCalculator } from '../utils/practiceCalculator.js';

const calculatorKeys = [
    ['C', 'C'], ['⌫', 'Backspace'], ['÷', '/'], ['×', '*'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['−', '-'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['+', '+'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['=', '='],
    ['0', '0'], ['.', '.'],
];

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
        context.arc(previous.current.x, previous.current.y, 2, 0, Math.PI * 2);
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
        context.lineWidth = 4;
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
        <div className="tool-header"><h2>계산기</h2></div>
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

function AnswerSheet() {
    const [answers, setAnswers] = useState(() => Array(100).fill(null));
    const markedCount = answers.filter(Boolean).length;

    const selectAnswer = (question, choice) => {
        setAnswers(current => current.map((answer, index) => index === question ? (answer === choice ? null : choice) : answer));
    };

    return <section className="surface tool-answer-sheet" aria-label="OMR 답안지">
        <div className="tool-header"><h2>OMR 답안지</h2><span className="omr-count">{markedCount}/100</span></div>
        <div className="omr-scroll">
            {Array.from({ length: 5 }, (_, group) => <div className="omr-group" key={group}>
                <div className="omr-group-label">{group * 20 + 1}–{group * 20 + 20}</div>
                {Array.from({ length: 20 }, (_, offset) => {
                    const question = group * 20 + offset;
                    return <div className="omr-row" key={question}>
                        <span className="omr-number">{question + 1}</span>
                        <div className="omr-choices" role="group" aria-label={`${question + 1}번 답안`}>
                            {[1, 2, 3, 4, 5].map(choice => <button key={choice} type="button"
                                className={answers[question] === choice ? 'selected' : ''}
                                aria-label={`${question + 1}번 ${choice}번 선택`}
                                aria-pressed={answers[question] === choice}
                                onClick={() => selectAnswer(question, choice)}>{choice}</button>)}
                        </div>
                    </div>;
                })}
            </div>)}
        </div>
    </section>;
}

export default function PracticeTools({ active }) {
    return <div className="tools-page">
        <div className="tools-stack">
            <ScratchPad />
            <Calculator active={active} />
        </div>
        <AnswerSheet />
    </div>;
}

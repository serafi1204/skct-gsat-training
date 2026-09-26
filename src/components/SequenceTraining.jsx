import React, { useRef, useState } from 'react';
import { isSequenceAnswerCorrect } from '../utils/generateSequenceProblems';
import PracticeHeader from './PracticeHeader';

export default function SequenceTraining({ problems, onComplete, onRestart, onExit }) {
    const promptFor = p => `${p.values.slice(0, -1).join(', ')}, ?`;
    const [index, setIndex] = useState(0);
    const [input, setInput] = useState('');
    const [results, setResults] = useState([]);
    const [finished, setFinished] = useState(false);
    const startedAt = useRef(Date.now());
    const submitted = useRef(false);
    const inputRef = useRef(null);
    const problem = problems[index];

    const submit = (event) => {
        event.preventDefault();
        if (submitted.current || finished) return;
        submitted.current = true;
        const nextResults = [...results, {
            problem, input,
            correct: isSequenceAnswerCorrect(input, problem.answer),
            timeTaken: (Date.now() - startedAt.current) / 1000,
        }];
        setResults(nextResults);
        if (index + 1 === problems.length) {
            setFinished(true);
            const correctCount = nextResults.filter(r => r.correct).length;
            onComplete({
                examType: 'SEQUENCE',
                date: new Date().toLocaleString('ko-KR'),
                accuracy: Math.round(correctCount / problems.length * 100),
                averageTime: Number((nextResults.reduce((sum, r) => sum + r.timeTaken, 0) / problems.length).toFixed(1)),
            });
        } else {
            setIndex(index + 1);
            setInput('');
            startedAt.current = Date.now();
            submitted.current = false;
            inputRef.current?.focus();
        }
    };

    if (finished) {
        const correctCount = results.filter(r => r.correct).length;
        const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
        return (
            <div className="practice-page"><div className="practice-container">
                <section className="result-hero">
                    <h1 className="text-xl font-bold mb-6">수열추리 연습 결과</h1>
                    <div className="metric-grid">
                        <div className="metric-card"><span>정답률</span><strong>{Math.round(correctCount / problems.length * 100)}%</strong></div>
                        <div className="metric-card"><span>맞힌 개수</span><strong>{correctCount} / {problems.length}</strong></div>
                        <div className="metric-card"><span>문제당 평균 시간</span><strong>{(totalTime / problems.length).toFixed(1)}초</strong></div>
                    </div>
                    <button onClick={onRestart} className="primary-button">다른 훈련하기</button>
                </section>
                <h2 className="review-heading">정답 및 해설</h2>
                <div className="space-y-4">
                    {results.map((result, i) => (
                        <section key={i} className="review-card">
                            <h3 className="font-bold mb-3">{i + 1}. {result.problem.label} · <span className={result.correct ? 'status-good' : 'status-bad'}>{result.correct ? '정답' : '오답'}</span></h3>
                            <p className="font-mono mb-2 break-words whitespace-pre-line">{promptFor(result.problem)}</p>
                            <p className="text-sm mb-2">입력: {result.input.trim() || '(공백)'} / 정답: {result.problem.answer}</p>
                            <p className="text-sm leading-relaxed">{result.problem.explanation}</p>
                        </section>
                    ))}
                </div>
            </div></div>
        );
    }

    return (
        <div className="practice-page"><div className="practice-container">
            <PracticeHeader title="수열추리" current={index + 1} total={problems.length} caption="숫자 규칙 연습" onExit={onExit} />
            <p className="instruction">수열의 규칙을 찾아 마지막 빈칸에 들어갈 수를 입력하세요.</p>
            <div className="question-card mb-6 text-2xl font-mono leading-loose break-words whitespace-pre-line" aria-label="문제">
                {promptFor(problem)}
            </div>
            <form onSubmit={submit}>
                <label htmlFor="sequence-answer" className="block font-bold mb-2">정답</label>
                <input
                    ref={inputRef} id="sequence-answer" type="text" autoFocus
                    autoComplete="off" spellCheck={false} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.repeat || e.nativeEvent.isComposing)) e.preventDefault(); }}
                    className="field-input text-lg font-mono mb-4"
                />
                <button type="submit" className="primary-button w-full">
                    {index + 1 === problems.length ? '제출 및 결과 보기 (Enter)' : '제출 및 다음 문제 (Enter)'}
                </button>
            </form>
        </div></div>
    );
}

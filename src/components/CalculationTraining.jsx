import React, { useRef, useState } from 'react';
import { scoreAdditionAnswer, summarizeAddition } from '../utils/additionScoring.js';
import PracticeHeader from './PracticeHeader';

const formatError = rate => rate === null ? '산출 불가' : `${rate.toFixed(2)}%`;
const formatResponse = value => value.trim() || '(공백)';

export default function CalculationTraining({ problems, onComplete, onRestart, onExit }) {
    const [page, setPage] = useState(0);
    const [answers, setAnswers] = useState(() => Array(problems.length).fill(''));
    const [results, setResults] = useState(null);
    const pageStartedAt = useRef(Date.now());
    const submitted = useRef(false);
    const firstInputRef = useRef(null);
    const pageSize = 5;
    const start = page * pageSize;
    const end = Math.min(start + pageSize, problems.length);
    const current = problems.slice(start, end);

    const setAnswer = (index, value) => {
        setAnswers(previous => {
            const next = [...previous];
            next[index] = value;
            return next;
        });
    };

    const submitPage = event => {
        event.preventDefault();
        if (submitted.current || results) return;
        submitted.current = true;
        const elapsed = (Date.now() - pageStartedAt.current) / 1000;
        const pageResults = current.map((problem, offset) => {
            const input = answers[start + offset];
            return { problem, input, ...scoreAdditionAnswer(problem, input), timeTaken: elapsed / current.length };
        });
        const nextResults = [...(windowResults.current), ...pageResults];
        windowResults.current = nextResults;
        if (end === problems.length) {
            setResults(nextResults);
            const summary = summarizeAddition(nextResults);
            onComplete({
                examType: 'ADDITION',
                date: new Date().toLocaleString('ko-KR'),
                ...summary,
                averageTime: Number((nextResults.reduce((sum, result) => sum + result.timeTaken, 0) / problems.length).toFixed(1)),
            });
        } else {
            setPage(page + 1);
            pageStartedAt.current = Date.now();
            submitted.current = false;
            window.scrollTo(0, 0);
            requestAnimationFrame(() => firstInputRef.current?.focus({ preventScroll: true }));
        }
    };
    const windowResults = useRef([]);

    if (results) {
        const summary = summarizeAddition(results);
        const averageTime = results.reduce((sum, result) => sum + result.timeTaken, 0) / results.length;
        return (
            <div className="practice-page"><div className="practice-container">
                <section className="result-hero">
                    <h1 className="text-xl font-bold mb-6">계산 훈련 결과</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-left">
                        {summary.byType.map(item => (
                            <div key={item.type} className="metric-card">
                                <h2 className="font-bold">{({ average: '평균 판단', sum: '합 계산', growth: '증가율 비교', share: '비율 판단' })[item.type]}</h2>
                                <p>{item.type === 'sum' ? `평균 오차율 ${formatError(item.averageErrorRate)} (유효 ${item.validCount}/${item.count})` : item.count ? `정답률 ${item.accuracy.toFixed(1)}% (${item.correctCount}/${item.count})` : '출제 없음'}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mb-2">전체 문항당 평균 시간: <strong>{averageTime.toFixed(1)}초</strong></p>
                    <p className="text-xs text-gray-600 mb-6">합의 빈칸·숫자가 아닌 입력 {summary.invalidCount}개는 평균 오차율에서 제외됩니다.</p>
                    <button type="button" onClick={onRestart} className="primary-button">다른 훈련하기</button>
                </section>
                <h2 className="review-heading">정답 및 해설</h2>
                <div className="space-y-4">
                    {results.map((result, index) => (
                        <section key={index} className="review-card">
                            <h3 className="font-bold mb-3">{index + 1}. {result.problem.label} · {result.problem.scoring === 'ox' ? result.correct ? '정답' : '오답' : `오차율 ${formatError(result.errorRate)}`}</h3>
                            <p className="font-mono whitespace-pre-line mb-2">{result.problem.prompt}</p>
                            <p className="text-sm mb-2">입력: {formatResponse(result.input)} / 정답: {result.problem.answer}</p>
                            <p className="text-sm leading-relaxed">{result.problem.explanation}</p>
                        </section>
                    ))}
                </div>
            </div></div>
        );
    }

    return (
        <div className="practice-page"><div className="practice-container">
            <PracticeHeader title="계산 훈련" current={page + 1} total={Math.ceil(problems.length / pageSize)} caption={`문항 ${start + 1}~${end} / ${problems.length}`} onExit={onExit} />
            <p className="instruction">평균·증가율·비율은 O/X를 고르고, 합은 숫자를 입력하세요. 5문항씩 제출합니다.</p>
            <form onSubmit={submitPage}>
                <div className="space-y-5">
                    {current.map((problem, offset) => {
                        const index = start + offset;
                        return (
                            <section key={index} className="question-card">
                                <h2 className="font-bold mb-3 text-teal-800">{index + 1}. {problem.label}</h2>
                                <p className="font-mono text-lg whitespace-pre-line break-words mb-4">{problem.prompt}</p>
                                {problem.scoring === 'ox' ? (
                                    <div className="flex gap-3" role="group" aria-label={`${index + 1}번 O/X 답안`}>
                                        {['O', 'X'].map(choice => (
                                            <button key={choice} type="button" aria-pressed={answers[index] === choice}
                                                onClick={() => setAnswer(index, choice)}
                                                className={`secondary-button min-w-16 ${answers[index] === choice ? '!bg-teal-700 !text-white !border-teal-700' : ''}`}>{choice}</button>
                                        ))}
                                    </div>
                                ) : (
                                    <input ref={offset === 0 ? firstInputRef : null} type="text" inputMode="decimal" autoComplete="off"
                                        aria-label={`${index + 1}번 합 답안`} value={answers[index]}
                                        onChange={event => setAnswer(index, event.target.value)}
                                        className="field-input max-w-48 font-mono" />
                                )}
                            </section>
                        );
                    })}
                </div>
                <button type="submit" className="primary-button w-full mt-6">
                    {end === problems.length ? '결과 보기' : '다음 5문제'}
                </button>
            </form>
        </div></div>
    );
}

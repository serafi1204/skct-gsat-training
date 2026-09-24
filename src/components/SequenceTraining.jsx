import React, { useRef, useState } from 'react';
import { isSequenceAnswerCorrect } from '../utils/generateSequenceProblems';
import { additionErrorRate, summarizeAddition } from '../utils/additionScoring';

export default function SequenceTraining({ problems, onComplete, onRestart, examType = 'SEQUENCE', title = '수열추리', instruction = '수열의 규칙을 찾아 마지막 빈칸에 들어갈 수를 입력하세요.' }) {
    const promptFor = (p) => p.prompt ?? `${p.values.slice(0, -1).join(', ')}, ?`;
    const useErrorRate = examType === 'ADDITION';
    const formatError = rate => rate === null ? '산출 불가' : `${rate.toFixed(2)}%`;
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
            ...(useErrorRate && problem.scoring !== 'choice' ? { errorRate: additionErrorRate(input, problem.answer) } : { correct: isSequenceAnswerCorrect(input, problem.answer) }),
            timeTaken: (Date.now() - startedAt.current) / 1000,
        }];
        setResults(nextResults);
        if (index + 1 === problems.length) {
            setFinished(true);
            const correctCount = nextResults.filter(r => r.correct).length;
            onComplete({
                examType,
                date: new Date().toLocaleString('ko-KR'),
                ...(useErrorRate ? summarizeAddition(nextResults) : { accuracy: Math.round(correctCount / problems.length * 100) }),
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
        const summary = useErrorRate ? summarizeAddition(results) : null;
        return (
            <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
                <section className="bg-white border border-black p-6 text-center mb-8">
                    <h1 className="text-xl font-bold mb-6">{title} 연습 결과</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {useErrorRate ? <>
                            <p>평균 오차율<br /><strong>{formatError(summary.averageErrorRate)}</strong></p>
                            <p>계산 유효 응답<br /><strong>{summary.validCount} / {summary.calculationCount}</strong></p>
                        </> : <>
                            <p>정답률<br /><strong>{Math.round(correctCount / problems.length * 100)}%</strong></p>
                            <p>맞힌 개수<br /><strong>{correctCount} / {problems.length}</strong></p>
                        </>}
                        <p>문제당 평균 시간<br /><strong>{(totalTime / problems.length).toFixed(1)}초</strong></p>
                    </div>
                    {useErrorRate && <div className="text-sm mb-6 space-y-2">
                        <p>오차율 = |입력값 − 정답| ÷ 정답 × 100. 낮을수록 정확합니다.<br />계산 문항의 미응답·잘못된 입력 {summary.invalidCount}개는 평균에서 제외합니다.</p>
                        {summary.byType.filter(item => item.count > 0).map(item => <p key={item.type}>{({average: '평균', sum: '합', share: '비율'})[item.type]}: 평균 오차율 {formatError(item.averageErrorRate)} (유효 {item.validCount}/{item.count})</p>)}
                        <p>증가율 비교: {summary.comparisonCount ? `${summary.comparisonCorrect}/${summary.comparisonCount} 정답 (${summary.comparisonAccuracy.toFixed(1)}%)` : '출제 없음'} · 계산 오차율과 별도 평가</p>
                    </div>}
                    <button onClick={onRestart} className="bg-black text-white py-2 px-8">처음으로</button>
                </section>
                <h2 className="text-lg font-bold mb-4">정답 및 해설</h2>
                <div className="space-y-4">
                    {results.map((result, i) => (
                        <section key={i} className="bg-white border border-black p-4">
                            <h3 className="font-bold mb-3">{i + 1}. {result.problem.label} · {useErrorRate && result.problem.scoring !== 'choice' ? `오차율 ${formatError(result.errorRate)}` : result.correct ? '정답' : '오답'}</h3>
                            <p className="font-mono mb-2 break-words whitespace-pre-line">{promptFor(result.problem)}</p>
                            <p className="text-sm mb-2">입력: {result.input.trim() || '(공백)'} / 정답: {result.problem.displayAnswer ?? result.problem.answer}</p>
                            <p className="text-sm leading-relaxed">{result.problem.explanation}</p>
                        </section>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
            <header className="flex justify-between items-center border-b border-black pb-4 mb-8">
                <h1 className="text-xl font-bold">{title}</h1>
                <p aria-live="polite">{index + 1} / {problems.length}문제</p>
            </header>
            {useErrorRate && <h2 className="font-bold mb-3">{problem.label}</h2>}
            <p className="text-sm mb-6">{problem.instruction ?? instruction}</p>
            {useErrorRate && problem.scoring !== 'choice' && <p className="text-sm mb-4 text-gray-600">정답과의 오차율로 평가합니다. 0%에 가까울수록 정확합니다.</p>}
            <div className="bg-white border border-black p-6 mb-8 text-xl font-mono leading-loose break-words whitespace-pre-line" aria-label="문제">
                {promptFor(problem)}
            </div>
            <form onSubmit={submit}>
                <label htmlFor="sequence-answer" className="block font-bold mb-2">정답</label>
                <input
                    ref={inputRef} id="sequence-answer" type="text" autoFocus
                    autoComplete="off" spellCheck={false} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.repeat || e.nativeEvent.isComposing)) e.preventDefault(); }}
                    className="border border-black w-full p-3 text-lg font-mono mb-4"
                />
                <button type="submit" className="bg-black text-white py-3 px-6 w-full hover:bg-gray-800">
                    {index + 1 === problems.length ? '제출 및 결과 보기 (Enter)' : '제출 및 다음 문제 (Enter)'}
                </button>
            </form>
        </div>
    );
}

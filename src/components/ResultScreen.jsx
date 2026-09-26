import React from 'react';
import DataTable from './DataTable';
import LinePlot from './LinePlot';

/**
 * 결과 화면 - 정답률, 맞힌 개수, 평균 시간 + 오답 노트
 */
const ResultScreen = ({ examType, results, sessionResult, totalRounds, problemCount, onRestart }) => {
    const isDataExam = examType === 'TABLE' || examType === 'PLOT';
    const totalSub = sessionResult?.totalCount || (isDataExam ? totalRounds * 8 : problemCount);
    const correctCount = sessionResult?.correctCount || 0;
    const averageTime = sessionResult?.averageTime || 0;
    const accuracy = sessionResult?.accuracy || 0;

    const lastResult = results[results.length - 1];
    const incorrect = [];

    if (isDataExam) {
        // 표 탐색 모드의 오답들 추출 (세트별로 묶음)
        results.forEach((r, roundIdx) => {
            const { problem, userInputs } = r;
            const wrongQuestions = [];
            problem.questions.forEach((q, qIdx) => {
                const u1 = Number(userInputs[qIdx * 2]);
                const u2 = Number(userInputs[qIdx * 2 + 1]);
                const hasA2 = q.answer2 !== undefined && q.answer2 !== null;
                
                if (u1 !== q.answer1 || (hasA2 && u2 !== q.answer2)) {
                    wrongQuestions.push({
                        num: qIdx + 1,
                        text: q.text,
                        a1: q.answer1,
                        a2: q.answer2,
                        hasA2,
                        u1: userInputs[qIdx * 2] || '(공백)',
                        u2: userInputs[qIdx * 2 + 1] || '(공백)',
                    });
                }
            });
            if (wrongQuestions.length > 0) {
                incorrect.push({
                    type: 'TABLE',
                    round: roundIdx + 1,
                    tables: problem.tables,
                    isPlot: problem.isPlot,
                    questions: wrongQuestions,
                });
            }
        });
    } else if (examType === 'PATTERN' && lastResult) {
        lastResult.problems.forEach((p, idx) => {
            const inputVal = (lastResult.userInputs[idx] || '').trim().toUpperCase();
            const correctVal = p.question.answer.trim().toUpperCase();
            if (inputVal !== correctVal) {
                incorrect.push({
                    type: 'PATTERN',
                    symbol: p.symbol,
                    ruleInput: p.rule.input,
                    ruleOutput: p.rule.output,
                    questionInput: p.question.input,
                    answer: p.question.answer,
                    user: lastResult.userInputs[idx] || '(공백)',
                });
            }
        });
    }

    return (
        <div className="practice-page"><div className="practice-container">
            <div className="result-hero">
                <span className="eyebrow">훈련 완료</span>
                <h2>오늘의 연습 결과</h2>
                <div className="metric-grid">
                    <div className="metric-card">
                        <span>정답률</span>
                        <strong>{accuracy}%</strong>
                    </div>
                    <div className="metric-card">
                        <span>맞힌 개수</span>
                        <strong>
                            {correctCount} / {totalSub}
                        </strong>
                    </div>
                    <div className="metric-card">
                        <span>
                            {isDataExam ? '세트당 평균 소요 시간' : '총 소요 시간'}
                        </span>
                        <strong>{averageTime}초</strong>
                    </div>
                </div>
                <button
                    onClick={onRestart}
                    className="primary-button"
                >
                    다른 훈련하기
                </button>
            </div>
            {incorrect.length > 0 && (
                <div>
                    <h3 className="review-heading">오답 노트 <span className="text-sm font-normal text-slate-500">· 다시 확인할 {isDataExam ? '세트' : '문항'} {incorrect.length}개</span></h3>
                    <div className="space-y-6">
                        {incorrect.map((item, i) => {
                            if (item.type === 'TABLE') {
                                const Display = item.isPlot ? LinePlot : DataTable;
                                return (
                                    <div key={i} className="review-card text-left">
                                        <h4 className="font-bold text-lg mb-3">
                                            세트 {item.round} 오답
                                        </h4>
                                        <div className="flex flex-col gap-4 mb-4">
                                            {item.tables.map((tObj, tIdx) => (
                                                <Display
                                                    key={tIdx}
                                                    template={tObj.template}
                                                    data={tObj.data}
                                                    colors={tObj.colors}
                                                    size="small"
                                                />
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            {item.questions.map((q, qIdx) => (
                                                <div
                                                    key={qIdx}
                                                    className="bg-gray-50 p-3 border border-gray-200"
                                                >
                                                    <div className="mb-1">
                                                        <strong>문항 {q.num}:</strong> {q.text}
                                                    </div>
                                                    <div className="text-sm">
                                                        <strong>정답:</strong> {q.a1}{q.hasA2 ? `, ${q.a2}` : ''}
                                                    </div>
                                                    <div className="text-sm">
                                                        <strong>입력:</strong>{' '}
                                                        <span
                                                            className={
                                                                Number(q.u1) !== q.a1
                                                                    ? 'text-red-600 line-through'
                                                                    : 'text-teal-700 font-bold'
                                                            }
                                                        >
                                                            {q.u1}
                                                        </span>
                                                        {q.hasA2 && (
                                                            <>
                                                                ,{' '}
                                                                <span
                                                                    className={
                                                                        Number(q.u2) !== q.a2
                                                                            ? 'text-red-600 line-through'
                                                                            : 'text-teal-700 font-bold'
                                                                    }
                                                                >
                                                                    {q.u2}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            } else if (item.type === 'PATTERN') {
                                return (
                                    <div key={i} className="review-card text-left">
                                        <div className="mb-1">
                                            <strong>규칙:</strong>{' '}
                                            <span className="font-mono font-bold tracking-wider">
                                                {item.ruleInput}
                                            </span>
                                            <span className="mx-2 text-gray-400">→</span>
                                            <span className="text-teal-700 font-bold mx-1">{item.symbol}</span>
                                            <span className="mx-2 text-gray-400">→</span>
                                            <span className="font-mono font-bold tracking-wider">
                                                {item.ruleOutput}
                                            </span>
                                        </div>
                                        <div className="mb-1">
                                            <strong>문제:</strong>{' '}
                                            <span className="font-mono font-bold tracking-wider">
                                                {item.questionInput}
                                            </span>
                                            <span className="mx-2 text-gray-400">→</span>
                                            <span className="text-teal-700 font-bold mx-1">{item.symbol}</span>
                                            <span className="mx-2 text-gray-400">→</span>
                                            <span className="font-mono font-bold tracking-wider">
                                                {item.answer}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>입력:</strong>{' '}
                                            <span className="text-red-600 line-through font-mono font-bold tracking-wider">
                                                {item.user}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}
            {incorrect.length === 0 && <div className="empty-state mt-6"><span aria-hidden="true">✓</span><h3>모두 정확하게 풀었습니다</h3><p>새로운 문제로 한 번 더 도전해 보세요.</p></div>}
        </div></div>
    );
};

export default ResultScreen;

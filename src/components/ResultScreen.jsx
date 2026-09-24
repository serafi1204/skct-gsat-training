import React from 'react';
import DataTable from './DataTable';
import LinePlot from './LinePlot';

/**
 * 결과 화면 - 정답률, 맞힌 개수, 평균 시간 + 오답 노트
 */
const ResultScreen = ({ examType, results, sessionResult, totalRounds, problemCount, onRestart }) => {
    const isDataExam = examType === 'TABLE' || examType === 'PLOT';
    const hasPlots = results.some(r => r.problem?.isPlot);
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
        <div className={`min-h-screen p-4 md:p-8 ${hasPlots ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}>
            <div className="bg-white border border-black p-6 mb-8 text-center">
                <h2 className="text-xl font-bold mb-6">[ 시험 결과 보고서 ]</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="border border-black p-4">
                        <div className="text-xs mb-1 font-bold">정답률</div>
                        <div className="text-xl font-bold">{accuracy}%</div>
                    </div>
                    <div className="border border-black p-4">
                        <div className="text-xs mb-1 font-bold">맞힌 개수</div>
                        <div className="text-xl font-bold">
                            {correctCount} / {totalSub}
                        </div>
                    </div>
                    <div className="border border-black p-4">
                        <div className="text-xs mb-1 font-bold">
                            {isDataExam ? '세트당 평균 소요 시간' : '총 소요 시간'}
                        </div>
                        <div className="text-xl font-bold">{averageTime}초</div>
                    </div>
                </div>
                <button
                    onClick={onRestart}
                    className="bg-black text-white font-bold py-2 px-8 hover:bg-gray-800 transition duration-200 text-sm"
                >
                    다시 시작
                </button>
            </div>
            {incorrect.length > 0 && (
                <div className="bg-white border border-black p-6">
                    <h3 className="text-lg font-bold mb-4">오답 노트</h3>
                    <div className="space-y-6">
                        {incorrect.map((item, i) => {
                            if (item.type === 'TABLE') {
                                const Display = item.isPlot ? LinePlot : DataTable;
                                return (
                                    <div key={i} className="border border-gray-300 p-4 text-left">
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
                                                                    : 'text-blue-600 font-bold'
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
                                                                            : 'text-blue-600 font-bold'
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
                                    <div key={i} className="border border-gray-300 p-3 text-left">
                                        <div className="mb-1">
                                            <strong>규칙:</strong>{' '}
                                            <span className="font-mono font-bold tracking-wider">
                                                {item.ruleInput}
                                            </span>
                                            <span className="mx-2 text-gray-400">→</span>
                                            <span className="text-blue-600 font-bold mx-1">{item.symbol}</span>
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
                                            <span className="text-blue-600 font-bold mx-1">{item.symbol}</span>
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
        </div>
    );
};

export default ResultScreen;

import React, { useState, useMemo, useRef, useEffect } from 'react';
import PracticeHeader from './PracticeHeader';

/**
 * GSAT 규칙 찾기 풀이 화면
 * 5개씩 묶어서 한 페이지에 표시, 상단에 규칙을 모아서(순서 랜덤) 보여줌
 */
const PatternPlaying = ({
    problemCount,
    patternProblems,
    patternInputs,
    onPatternChange,
    onSubmit,
    inputRefs,
    submitBtnRef,
    onExit,
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const problemsPerPage = 5;
    const totalPages = Math.ceil(problemCount / problemsPerPage);
    const startIndex = currentPage * problemsPerPage;
    const currentProblems = patternProblems.slice(startIndex, startIndex + problemsPerPage);
    const nextBtnRef = useRef(null);

    // 현재 페이지의 규칙들을 셔플
    const shuffledRules = useMemo(() => {
        return currentProblems
            .map(p => ({ symbol: p.symbol, rule: p.rule }))
            .sort(() => 0.5 - Math.random());
    }, [currentPage, patternProblems]);

    // 페이지 변경 시 첫 번째 인풋 포커스
    useEffect(() => {
        setTimeout(() => {
            inputRefs.current[startIndex]?.focus();
        }, 50);
    }, [currentPage, startIndex, inputRefs]);

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleLocalKeyDown = (e, idx) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const isLastInPage = (idx % problemsPerPage) === (problemsPerPage - 1) || idx === problemCount - 1;
            const isLastOverall = idx === problemCount - 1;

            if (isLastOverall) {
                submitBtnRef.current?.focus();
            } else if (isLastInPage) {
                nextBtnRef.current?.focus();
            } else {
                inputRefs.current[idx + 1]?.focus();
            }
        }
    };

    return (
        <div className="practice-page"><div className="practice-container">
            <PracticeHeader title="규칙 찾기" current={currentPage + 1} total={totalPages} caption={`문항 ${startIndex + 1}~${Math.min(startIndex + problemsPerPage, problemCount)} / ${problemCount}`} onExit={onExit} />
            
            <div className="question-card mb-6">
                <div className="mb-3 font-bold text-sm text-slate-600">
                    아래 변환 예시를 참고해 문제의 빈칸을 채우세요.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shuffledRules.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="font-mono font-bold text-black text-base tracking-wider">
                                {r.rule.input}
                            </span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="text-teal-700 font-bold mx-1">{r.symbol}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="font-mono font-bold text-black text-base tracking-wider">
                                {r.rule.output}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="question-card flex flex-col gap-5">
                {currentProblems.map((p, i) => {
                    const idx = startIndex + i;
                    return (
                        <div
                            key={idx}
                            className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                        >
                            <div className="flex items-center gap-2">
                                <div className="font-bold w-8 flex-shrink-0 text-right text-sm text-teal-700">
                                    {idx + 1}.
                                </div>
                                <span className="text-sm font-medium">
                                    문제:{' '}
                                    <span className="font-mono font-bold text-base tracking-wider">
                                        {p.question.input}
                                    </span>
                                    <span className="mx-2 text-gray-400">→</span>
                                    <span className="text-teal-700 font-bold mx-1">{p.symbol}</span>
                                    <span className="mx-2 text-gray-400">→</span>
                                </span>
                                <input
                                    type="text"
                                    ref={(el) => (inputRefs.current[idx] = el)}
                                    value={patternInputs[idx]}
                                    onChange={(e) => onPatternChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleLocalKeyDown(e, idx)}
                                    className="answer-input w-24 uppercase font-mono text-base tracking-wider"
                                    aria-label={`${idx + 1}번 정답`}
                                    maxLength={4}
                                    style={{ textTransform: 'uppercase' }}
                                    autoCapitalize="characters"
                                    autoCorrect="off"
                                    spellCheck="false"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="answer-actions">
                {currentPage < totalPages - 1 ? (
                    <button
                        ref={nextBtnRef}
                        onClick={handleNextPage}
                        className="primary-button"
                    >
                        다음
                    </button>
                ) : (
                    <button
                        ref={submitBtnRef}
                        onClick={onSubmit}
                        className="primary-button"
                    >
                        제출
                    </button>
                )}
            </div>
        </div></div>
    );
};

export default PatternPlaying;

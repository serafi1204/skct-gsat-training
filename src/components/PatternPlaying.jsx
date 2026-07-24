import React, { useState, useMemo, useRef, useEffect } from 'react';

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
        <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-black pb-4">
                <h2 className="text-xl font-bold">
                    [ 규칙 찾기 ({startIndex + 1} ~ {Math.min(startIndex + problemsPerPage, problemCount)} / {problemCount}문제) ]
                </h2>
                <div className="text-sm font-bold text-gray-500 hidden md:block">
                    GSAT 추리 대비
                </div>
            </div>
            
            <div className="mb-6 bg-gray-50 border border-gray-300 p-4">
                <div className="mb-3 font-bold text-sm text-gray-700">
                    ※ 다음 규칙들을 참고하여 아래 문제들의 빈칸을 채우시오.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shuffledRules.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="font-mono font-bold text-black text-base tracking-wider">
                                {r.rule.input}
                            </span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="text-blue-600 font-bold mx-1">{r.symbol}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="font-mono font-bold text-black text-base tracking-wider">
                                {r.rule.output}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {currentProblems.map((p, i) => {
                    const idx = startIndex + i;
                    return (
                        <div
                            key={idx}
                            className="border-b border-gray-200 pb-4 last:border-0"
                        >
                            <div className="flex items-center gap-2">
                                <div className="font-bold w-10 flex-shrink-0 text-right text-sm">
                                    {idx + 1}.
                                </div>
                                <span className="text-sm font-medium">
                                    문제:{' '}
                                    <span className="font-mono font-bold text-base tracking-wider">
                                        {p.question.input}
                                    </span>
                                    <span className="mx-2 text-gray-400">→</span>
                                    <span className="text-blue-600 font-bold mx-1">{p.symbol}</span>
                                    <span className="mx-2 text-gray-400">→</span>
                                </span>
                                <input
                                    type="text"
                                    ref={(el) => (inputRefs.current[idx] = el)}
                                    value={patternInputs[idx]}
                                    onChange={(e) => onPatternChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleLocalKeyDown(e, idx)}
                                    className="w-24 p-1 border border-black text-center outline-none focus:ring-1 focus:ring-black bg-blue-50 focus:bg-white uppercase font-mono font-bold text-base tracking-wider"
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

            <div className="mt-8 flex justify-end gap-4">
                {currentPage < totalPages - 1 ? (
                    <button
                        ref={nextBtnRef}
                        onClick={handleNextPage}
                        className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 transition duration-200 text-sm shadow-sm"
                    >
                        다음
                    </button>
                ) : (
                    <button
                        ref={submitBtnRef}
                        onClick={onSubmit}
                        className="border border-black bg-white hover:bg-black hover:text-white text-black font-bold py-2 px-6 transition duration-200 text-sm shadow-sm"
                    >
                        제출
                    </button>
                )}
            </div>
        </div>
    );
};

export default PatternPlaying;

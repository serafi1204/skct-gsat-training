import React from 'react';
import DataTable from './DataTable';

/**
 * 표 탐색 풀이 화면
 */
const TablePlaying = ({
    currentRound,
    totalRounds,
    tableProblem,
    userInputs,
    onInputChange,
    onKeyDown,
    onNext,
    inputRefs,
    submitBtnRef,
}) => {
    return (
        <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-black pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">
                        [ 문항 {currentRound + 1} / {totalRounds} ]
                    </h2>
                </div>
                <div className="text-sm font-bold text-gray-500 hidden md:block">
                    SKCT 실행역량 / 수리 대비
                </div>
            </div>
            <div className="mb-6 font-bold text-sm">
                ※ 다음 표의 데이터를 바탕으로 하단 각 지문이 가리키는 수치를 순서대로
                기입하시오. (정답 입력 시 콤마 제외)
            </div>
            <div className="flex flex-col gap-8 mb-8">
                {tableProblem.tables.map((tObj, tIdx) => (
                    <DataTable
                        key={tIdx}
                        template={tObj.template}
                        data={tObj.data}
                        size="normal"
                    />
                ))}
            </div>
            <div className="flex flex-col gap-3 flex-grow border-t border-black pt-6">
                {tableProblem.questions.map((q, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-200 pb-3 last:border-0"
                    >
                        <div className="flex items-start md:items-center gap-2 flex-grow">
                            <div className="font-bold w-5 flex-shrink-0 text-right text-sm">
                                {idx + 1}.
                            </div>
                            <span className="font-medium text-sm pr-2 leading-tight">
                                {q.text}
                            </span>
                        </div>
                        <div className="flex gap-2 pl-7 md:pl-0 flex-shrink-0">
                            <input
                                type="number"
                                ref={(el) => (inputRefs.current[idx * 2] = el)}
                                value={userInputs[idx * 2]}
                                onChange={(e) => onInputChange(idx * 2, e.target.value)}
                                onKeyDown={(e) => onKeyDown(e, idx * 2)}
                                className="w-16 p-1 border border-black text-center outline-none focus:ring-1 focus:ring-black font-bold text-base bg-blue-50 focus:bg-white"
                                autoFocus={idx === 0}
                            />
                            {q.answer2 !== undefined && q.answer2 !== null && (
                                <input
                                    type="number"
                                    ref={(el) => (inputRefs.current[idx * 2 + 1] = el)}
                                    value={userInputs[idx * 2 + 1]}
                                    onChange={(e) => onInputChange(idx * 2 + 1, e.target.value)}
                                    onKeyDown={(e) => onKeyDown(e, idx * 2 + 1)}
                                    className="w-16 p-1 border border-black text-center outline-none focus:ring-1 focus:ring-black font-bold text-base bg-blue-50 focus:bg-white"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end">
                <button
                    ref={submitBtnRef}
                    onClick={onNext}
                    className="border border-black bg-white hover:bg-black hover:text-white text-black font-bold py-2 px-6 transition duration-200 text-sm shadow-sm"
                >
                    {currentRound + 1 === totalRounds ? '시험 종료' : '다음 문항 (Enter)'}
                </button>
            </div>
        </div>
    );
};

export default TablePlaying;

import React from 'react';
import DataTable from './DataTable';
import LinePlot from './LinePlot';
import PracticeHeader from './PracticeHeader';

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
    isPlot = false,
    onExit,
}) => {
    const Display = isPlot ? LinePlot : DataTable;
    return (
        <div className="practice-page">
          <div className="practice-container">
            <PracticeHeader title="자료 읽기" current={currentRound + 1} total={totalRounds} caption={isPlot ? '선 그래프 · 세트 진행' : '표 탐색 · 세트 진행'} onExit={onExit} />
            <p className="instruction">{isPlot ? '그래프' : '표'}에서 지문이 가리키는 수치를 찾아 순서대로 입력하세요. 콤마는 생략해도 됩니다.</p>
            <div className="flex flex-col gap-5 mb-6">
                {tableProblem.tables.map((tObj, tIdx) => (
                    <Display
                        key={tIdx}
                        template={tObj.template}
                        data={tObj.data}
                        colors={tObj.colors}
                        size="normal"
                    />
                ))}
            </div>
            <div className="question-card flex flex-col gap-4">
                {tableProblem.questions.map((q, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                    >
                        <div className="flex items-start md:items-center gap-2 flex-grow">
                            <div className="font-bold w-5 flex-shrink-0 text-right text-sm text-teal-700">
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
                                className="answer-input w-20 text-base"
                                aria-label={`${idx + 1}번 첫 번째 수치`}
                                autoFocus={!isPlot && idx === 0}
                            />
                            {q.answer2 !== undefined && q.answer2 !== null && (
                                <input
                                    type="number"
                                    ref={(el) => (inputRefs.current[idx * 2 + 1] = el)}
                                    value={userInputs[idx * 2 + 1]}
                                    onChange={(e) => onInputChange(idx * 2 + 1, e.target.value)}
                                    onKeyDown={(e) => onKeyDown(e, idx * 2 + 1)}
                                    className="answer-input w-20 text-base"
                                    aria-label={`${idx + 1}번 두 번째 수치`}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="answer-actions">
                <button
                    ref={submitBtnRef}
                    onClick={onNext}
                    className="primary-button"
                >
                    {currentRound + 1 === totalRounds ? '시험 종료' : '다음 문항 (Enter)'}
                </button>
            </div>
          </div>
        </div>
    );
};

export default TablePlaying;

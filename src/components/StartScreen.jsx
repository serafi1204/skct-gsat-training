import React from 'react';
import HistoryChart from './HistoryChart';

/**
 * 시작 화면 - 시험 유형 선택, 문제 수 설정, 과거 기록 차트
 */
const StartScreen = ({
    examType,
    setExamType,
    totalRounds,
    setTotalRounds,
    problemCount,
    setProblemCount,
    onStart,
    history,
}) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 bg-gray-50">
            <div className="bg-white border border-black p-8 max-w-2xl w-full text-center">
                <h1 className="text-2xl font-bold mb-4">SKCT 연습 프로그램</h1>
                <p className="mb-6 text-sm text-gray-700">
                    시험 유형을 선택하고 문제 수를 지정하세요.
                </p>
                <div className="mb-4">
                    <label className="block font-bold mb-2">시험 유형</label>
                    <select
                        className="w-full p-2 border border-black"
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                    >
                        <option value="TABLE">표 탐색 (기존)</option>
                        <option value="PATTERN">규칙 찾기 (GSAT)</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block font-bold mb-2">문제 수</label>
                    <select
                        className="w-full p-2 border border-black"
                        value={examType === 'TABLE' ? totalRounds : problemCount}
                        onChange={(e) => {
                            if (examType === 'TABLE') setTotalRounds(Number(e.target.value));
                            else setProblemCount(Number(e.target.value));
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                    </select>
                </div>
                <button
                    onClick={onStart}
                    className="w-full bg-black text-white font-bold py-3 px-4 hover:bg-gray-800 transition duration-200"
                >
                    시작
                </button>
                {history.length > 0 && (
                    <div className="mt-12 border-t border-black pt-8">
                        <h2 className="text-xl font-bold mb-4">[ 내 기록 변화 ]</h2>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">표 탐색 기록</h3>
                            <HistoryChart history={history.filter((r) => r.examType === 'TABLE')} />
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">규칙 찾기 기록</h3>
                            <HistoryChart history={history.filter((r) => r.examType === 'PATTERN')} />
                        </div>
                        <div className="text-xs text-gray-500 mt-2 mb-6 text-right">
                            * 최근 20회 기록 표시
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StartScreen;

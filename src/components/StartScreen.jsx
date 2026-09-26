import React from 'react';
import HistoryChart from './HistoryChart';
import CalculationHistory from './CalculationHistory';

/**
 * 시작 화면 - 시험 유형 선택, 문제 수 설정, 과거 기록 차트
 */
const StartScreen = ({
    preferences,
    onPreferenceChange,
    onStart,
    history,
    onClearHistory,
}) => {
    const { examType, totalRounds, problemCount } = preferences;
    const setting = (key, label, options, suffix = '') => (
        <label className="block text-left text-sm">
            <span className="block mb-1">{label}</span>
            <select className="w-full border border-black p-2" value={preferences[key]}
                onChange={event => onPreferenceChange(key, Number(event.target.value))}>
                {options.map(value => <option key={value} value={value}>{value}{suffix}</option>)}
            </select>
        </label>
    );
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
                        onChange={(e) => onPreferenceChange('examType', e.target.value)}
                    >
                        <option value="TABLE">자료 읽기 (표 · 그래프)</option>
                        <option value="PATTERN">규칙 찾기 (GSAT)</option>
                        <option value="SEQUENCE">수열추리</option>
                        <option value="ADDITION">계산 훈련 (평균 · 합 · 증가율 · 비율)</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block font-bold mb-2">문제 수</label>
                    <select
                        className="w-full p-2 border border-black"
                        value={examType === 'TABLE' ? totalRounds : problemCount}
                        onChange={(e) => {
                            onPreferenceChange(examType === 'TABLE' ? 'totalRounds' : 'problemCount', Number(e.target.value));
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                    </select>
                </div>
                <div className="mb-6 border border-gray-300 p-4">
                    <h2 className="font-bold mb-3">문제 생성 설정</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {examType === 'TABLE' && <>
                            {setting('tablePlotPercent', '그래프 출제 비율', [0, 25, 50, 75, 100], '%')}
                            {setting('tableMin', '표 숫자 최솟값', [100, 500, 1000, 2000, 3000, 4000])}
                            {setting('tableMax', '표 숫자 최댓값', [5000, 7000, 9000, 9999])}
                            {setting('plotMin', '그래프 숫자 최솟값', [100, 500, 1100, 2000, 3000])}
                            {setting('plotMax', '그래프 숫자 최댓값', [7000, 8000, 8600, 9000, 9999])}
                        </>}
                        {examType === 'PATTERN' && setting('patternSubstitutionPercent', '치환 문제 출제 비율', [0, 10, 15, 25, 50, 100], '%')}
                        {examType === 'SEQUENCE' && setting('sequenceMax', '수열 숫자 최댓값', [300, 500, 750, 999])}
                        {examType === 'ADDITION' && <>
                            {setting('calculationMin', '계산 숫자 최솟값', [100, 500, 1000, 2000, 3000])}
                            {setting('calculationMax', '계산 숫자 최댓값', [7000, 8000, 9000, 9999])}
                        </>}
                    </div>
                    {examType === 'TABLE' && <p className="text-xs text-gray-600 mt-3 text-left">그래프 수치는 선과 라벨이 겹치지 않도록 설정 범위 안에서 간격을 두고 생성됩니다.</p>}
                </div>
                <button
                    onClick={onStart}
                    className="w-full bg-black text-white font-bold py-3 px-4 hover:bg-gray-800 transition duration-200"
                >
                    시작
                </button>
                <button type="button" onClick={onClearHistory} disabled={history.length === 0}
                    className="mt-3 w-full border border-black px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    전체 기록 초기화
                </button>
                {history.length > 0 && (
                    <div className="mt-12 border-t border-black pt-8">
                        <h2 className="text-xl font-bold mb-4">[ 내 기록 변화 ]</h2>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">자료 읽기 기록 (표 · 그래프)</h3>
                            <HistoryChart history={history.filter((r) => ['TABLE', 'PLOT'].includes(r.examType))} />
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">규칙 찾기 기록</h3>
                            <HistoryChart history={history.filter((r) => r.examType === 'PATTERN')} />
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">수열추리 기록</h3>
                            <HistoryChart history={history.filter((r) => r.examType === 'SEQUENCE')} />
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">계산 훈련 기록</h3>
                            <CalculationHistory history={history.filter((r) => r.examType === 'ADDITION')} />
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

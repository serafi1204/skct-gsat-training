import React, { useState, useEffect, useRef } from 'react';
import { generateTableProblem } from './utils/generateTableProblem';
import { generatePatternProblems } from './utils/generatePatternProblems';
import StartScreen from './components/StartScreen';
import TablePlaying from './components/TablePlaying';
import PatternPlaying from './components/PatternPlaying';
import ResultScreen from './components/ResultScreen';
import SequenceTraining from './components/SequenceTraining';
import { generateSequenceProblems } from './utils/generateSequenceProblems';
import { generateAdditionProblems } from './utils/generateAdditionProblems';
import CalculationTraining from './components/CalculationTraining';
import { loadPreferences, savePreferences, loadPlotHistory, savePlotHistory, clearPlotHistory, normalizePreferences } from './utils/trainingPreferences';

const App = () => {
    // 공통 상태
    const [gameState, setGameState] = useState('START');
    const [preferences, setPreferences] = useState(loadPreferences);
    const { examType, totalRounds, problemCount } = preferences;
    const isDataExam = examType === 'TABLE';
    const [currentRound, setCurrentRound] = useState(0);
    const [problemSequence, setProblemSequence] = useState([]);
    const [tableProblem, setTableProblem] = useState(null);
    const [userInputs, setUserInputs] = useState(Array(8).fill(''));
    const [patternProblems, setPatternProblems] = useState([]);
    const [patternInputs, setPatternInputs] = useState([]);
    const [results, setResults] = useState([]);
    const [roundStartTime, setRoundStartTime] = useState(0);
    const [history, setHistory] = useState([]);
    const [sequenceProblems, setSequenceProblems] = useState([]);

    // 세션 최종 결과용 상태 (채점 로직 버그 해결용)
    const [sessionResult, setSessionResult] = useState(null);

    const inputRefs = useRef([]);
    const submitBtnRef = useRef(null);

    // localStorage 로 히스토리 로드
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('skctHistory') || '[]');
            if (Array.isArray(saved) && saved.length) {
                setHistory(saved);
                savePlotHistory(saved);
            } else {
                setHistory(loadPlotHistory());
            }
        } catch {
            setHistory(loadPlotHistory());
        }
    }, []);

    useEffect(() => { savePreferences(preferences); }, [preferences]);

    const updatePreference = (key, value) => setPreferences(previous => normalizePreferences({ ...previous, [key]: value }));

    const saveRecord = record => {
        const updated = [...history, record];
        localStorage.setItem('skctHistory', JSON.stringify(updated));
        savePlotHistory(updated);
        setHistory(updated);
    };

    const handleStart = () => {
        if (examType === 'SEQUENCE' || examType === 'ADDITION') {
            setSequenceProblems(examType === 'ADDITION'
                ? generateAdditionProblems(problemCount, { min: preferences.calculationMin, max: preferences.calculationMax })
                : generateSequenceProblems(problemCount, { maxValue: preferences.sequenceMax }));
            setGameState('PLAYING');
        } else if (isDataExam) {
            const numTwoTables = Math.floor(totalRounds / 2);
            const seq = Array(totalRounds).fill(false);
            for (let i = 0; i < numTwoTables; i++) seq[i] = true;
            // 섞기
            for (let i = seq.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [seq[i], seq[j]] = [seq[j], seq[i]];
            }
            setProblemSequence(seq);
            setResults([]);
            setCurrentRound(0);
            setTableProblem(generateTableProblem(seq[0], { plot: Math.random() * 100 < preferences.tablePlotPercent, ...preferences }));
            setUserInputs(Array(8).fill(''));
            setRoundStartTime(Date.now());
            setGameState('PLAYING');
        } else if (examType === 'PATTERN') {
            setPatternProblems(generatePatternProblems(problemCount, { substitutionPercent: preferences.patternSubstitutionPercent }));
            setPatternInputs(Array(problemCount).fill(''));
            setResults([]);
            setCurrentRound(0);
            setRoundStartTime(Date.now());
            setGameState('PLAYING');
        }
    };

    // 입력 처리 (표)
    const handleInputChange = (idx, value) => {
        const newArr = [...userInputs];
        newArr[idx] = value;
        setUserInputs(newArr);
    };



    // 입력 처리 (패턴)
    const handlePatternChange = (idx, value) => {
        const newArr = [...patternInputs];
        newArr[idx] = value;
        setPatternInputs(newArr);
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 엔터 기본 동작 차단
            if (isDataExam) {
                if (idx < 7) {
                    let nextIdx = idx + 1;
                    // 숨겨진 입력창 건너뛰기
                    while (nextIdx < 8 && !inputRefs.current[nextIdx]) {
                        nextIdx++;
                    }
                    if (nextIdx < 8) {
                        inputRefs.current[nextIdx]?.focus();
                    } else {
                        submitBtnRef.current?.focus();
                    }
                } else {
                    submitBtnRef.current?.focus();
                }
            } else {
                if (idx < problemCount - 1) {
                    inputRefs.current[idx + 1]?.focus();
                } else {
                    submitBtnRef.current?.focus();
                }
            }
        }
    };

    const handleNext = () => {
        const timeTaken = (Date.now() - roundStartTime) / 1000;
        if (isDataExam) {
            const newResults = [...results, { problem: tableProblem, userInputs: [...userInputs], timeTaken }];
            setResults(newResults);
            if (currentRound + 1 >= totalRounds) {
                finalizeResults(newResults);
            } else {
                const next = currentRound + 1;
                setCurrentRound(next);
                setTableProblem(generateTableProblem(problemSequence[next], { plot: Math.random() * 100 < preferences.tablePlotPercent, ...preferences }));
                setUserInputs(Array(8).fill(''));
                setRoundStartTime(Date.now());
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
            }
        } else if (examType === 'PATTERN') {
            const newResults = [...results, { problems: patternProblems, userInputs: [...patternInputs], timeTaken }];
            setResults(newResults);
            finalizeResults(newResults);
        }
    };

    const finalizeResults = (finalResults) => {
        let totalCorrect = 0;
        let totalSub = 0;
        let totalTime = 0;
        finalResults.forEach((r) => {
            totalTime += r.timeTaken;
            if (isDataExam) {
                const { problem, userInputs } = r;
                problem.questions.forEach((q, qIdx) => {
                    if (Number(userInputs[qIdx * 2]) === q.answer1) totalCorrect++;
                    totalSub++;
                    if (q.answer2 !== undefined && q.answer2 !== null) {
                        if (Number(userInputs[qIdx * 2 + 1]) === q.answer2) totalCorrect++;
                        totalSub++;
                    }
                });
            } else if (examType === 'PATTERN') {
                const { problems, userInputs } = r;
                problems.forEach((p, idx) => {
                    const inputVal = (userInputs[idx] || '').trim().toUpperCase();
                    const correctVal = p.question.answer.trim().toUpperCase();
                    if (inputVal === correctVal) totalCorrect++;
                });
            }
        });

        // TABLE의 totalSub는 위 루프에서 동적으로 계산됨
        if (!isDataExam) {
            totalSub = problemCount;
        }

        const finalAccuracy = Math.round((totalCorrect / totalSub) * 100);
        const avgTime = Number((totalTime / finalResults.length).toFixed(1));

        // 현재 연습 결과를 세션 상태에 올바르게 바인딩
        setSessionResult({
            accuracy: finalAccuracy,
            correctCount: totalCorrect,
            totalCount: totalSub,
            averageTime: avgTime,
        });

        const newRecord = {
            date: new Date().toLocaleString('ko-KR'),
            accuracy: finalAccuracy,
            averageTime: avgTime,
            examType: examType,
        };
        saveRecord(newRecord);
        setGameState('RESULT');
    };

    // ------------------- 화면 렌더링 -------------------
    if (gameState === 'START') {
        return (
            <StartScreen
                preferences={preferences}
                onPreferenceChange={updatePreference}
                onStart={handleStart}
                history={history}
                onClearHistory={() => {
                    if (window.confirm('모든 훈련 기록을 초기화할까요? 삭제한 기록은 복구할 수 없습니다.')) {
                        localStorage.removeItem('skctHistory');
                        clearPlotHistory();
                        setHistory([]);
                    }
                }}
            />
        );
    }

    if (gameState === 'PLAYING') {
        if (examType === 'ADDITION') {
            return <CalculationTraining
                problems={sequenceProblems}
                onComplete={saveRecord}
                onRestart={() => setGameState('START')}
            />;
        } else if (examType === 'SEQUENCE') {
            return (
                <SequenceTraining
                    problems={sequenceProblems}
                    onComplete={saveRecord}
                    onRestart={() => setGameState('START')}
                />
            );
        } else if (isDataExam) {
            return (
                <TablePlaying
                    isPlot={tableProblem.isPlot}
                    currentRound={currentRound}
                    totalRounds={totalRounds}
                    tableProblem={tableProblem}
                    userInputs={userInputs}
                    onInputChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onNext={handleNext}
                    inputRefs={inputRefs}
                    submitBtnRef={submitBtnRef}
                />
            );
        } else if (examType === 'PATTERN') {
            return (
                <PatternPlaying
                    problemCount={problemCount}
                    patternProblems={patternProblems}
                    patternInputs={patternInputs}
                    onPatternChange={handlePatternChange}
                    onKeyDown={handleKeyDown}
                    onSubmit={handleNext}
                    inputRefs={inputRefs}
                    submitBtnRef={submitBtnRef}
                />
            );
        }
    }

    if (gameState === 'RESULT') {
        return (
            <ResultScreen
                examType={examType}
                results={results}
                sessionResult={sessionResult}
                totalRounds={totalRounds}
                problemCount={problemCount}
                onRestart={() => setGameState('START')}
            />
        );
    }

    return null;
};

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { generateTableProblem } from './utils/generateTableProblem';
import { generatePatternProblems } from './utils/generatePatternProblems';
import StartScreen from './components/StartScreen';
import TablePlaying from './components/TablePlaying';
import PatternPlaying from './components/PatternPlaying';
import ResultScreen from './components/ResultScreen';

const App = () => {
    // 공통 상태
    const [gameState, setGameState] = useState('START');
    const [examType, setExamType] = useState('TABLE'); // TABLE or PATTERN
    const [totalRounds, setTotalRounds] = useState(5);
    const [problemCount, setProblemCount] = useState(20);
    const [currentRound, setCurrentRound] = useState(0);
    const [problemSequence, setProblemSequence] = useState([]);
    const [tableProblem, setTableProblem] = useState(null);
    const [userInputs, setUserInputs] = useState(Array(8).fill(''));
    const [patternProblems, setPatternProblems] = useState([]);
    const [patternInputs, setPatternInputs] = useState([]);
    const [results, setResults] = useState([]);
    const [roundStartTime, setRoundStartTime] = useState(0);
    const [history, setHistory] = useState([]);

    // 세션 최종 결과용 상태 (채점 로직 버그 해결용)
    const [sessionResult, setSessionResult] = useState(null);

    const inputRefs = useRef([]);
    const submitBtnRef = useRef(null);

    // localStorage 로 히스토리 로드
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('skctHistory') || '[]');
        setHistory(saved);
    }, []);

    const handleStart = () => {
        if (examType === 'TABLE') {
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
            setTableProblem(generateTableProblem(seq[0]));
            setUserInputs(Array(8).fill(''));
            setRoundStartTime(Date.now());
            setGameState('PLAYING');
        } else if (examType === 'PATTERN') {
            setPatternProblems(generatePatternProblems(problemCount));
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
            if (examType === 'TABLE') {
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
        if (examType === 'TABLE') {
            const newResults = [...results, { problem: tableProblem, userInputs: [...userInputs], timeTaken }];
            setResults(newResults);
            if (currentRound + 1 >= totalRounds) {
                finalizeResults(newResults);
            } else {
                const next = currentRound + 1;
                setCurrentRound(next);
                setTableProblem(generateTableProblem(problemSequence[next]));
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
            if (examType === 'TABLE') {
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
        if (examType !== 'TABLE') {
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
        const existing = JSON.parse(localStorage.getItem('skctHistory') || '[]');
        const updated = [...existing, newRecord];
        localStorage.setItem('skctHistory', JSON.stringify(updated));
        setHistory(updated);
        setGameState('RESULT');
    };

    // ------------------- 화면 렌더링 -------------------
    if (gameState === 'START') {
        return (
            <StartScreen
                examType={examType}
                setExamType={setExamType}
                totalRounds={totalRounds}
                setTotalRounds={setTotalRounds}
                problemCount={problemCount}
                setProblemCount={setProblemCount}
                onStart={handleStart}
                history={history}
            />
        );
    }

    if (gameState === 'PLAYING') {
        if (examType === 'TABLE') {
            return (
                <TablePlaying
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

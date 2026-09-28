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
import ConfirmDialog from './components/ConfirmDialog';
import { PracticeToolStack } from './components/PracticeTools';
import { TimerAlert } from './components/PracticeTimers';
import { loadPreferences, savePreferences, loadPlotHistory, savePlotHistory, clearPlotHistory, normalizePreferences } from './utils/trainingPreferences';
import { initialTimers, tickTimers, updateTimer } from './utils/practiceTimers.js';
import { localDateKey } from './utils/dailyTodo.js';
import { DAILY_HISTORY_VERSION_KEY, prepareDailyHistory } from './utils/dailyHistory.js';

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
    const [pendingAction, setPendingAction] = useState(null);
    const [timers, setTimers] = useState(initialTimers);

    // 세션 최종 결과용 상태 (채점 로직 버그 해결용)
    const [sessionResult, setSessionResult] = useState(null);

    const inputRefs = useRef([]);
    const submitBtnRef = useRef(null);

    // 기존 회차별 기록은 한 번만 오늘 날짜로 묶는다.
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('skctHistory') || '[]');
            const source = Array.isArray(saved) && saved.length ? saved : loadPlotHistory();
            const migrateExisting = localStorage.getItem(DAILY_HISTORY_VERSION_KEY) !== '1';
            const prepared = prepareDailyHistory(source, localDateKey(), migrateExisting);
            setHistory(prepared);
            if (migrateExisting || !Array.isArray(saved) || !saved.length || source.some(record => !record.dateKey)) {
                localStorage.setItem('skctHistory', JSON.stringify(prepared));
            }
            localStorage.setItem(DAILY_HISTORY_VERSION_KEY, '1');
            if (prepared.length) savePlotHistory(prepared);
        } catch {
            setHistory(prepareDailyHistory(loadPlotHistory()));
        }
    }, []);

    useEffect(() => { savePreferences(preferences); }, [preferences]);

    useEffect(() => {
        const interval = window.setInterval(() => setTimers(current => tickTimers(current, Date.now())), 250);
        return () => window.clearInterval(interval);
    }, []);

    const handleTimerAction = (id, action) => setTimers(current => updateTimer(current, id, action, Date.now()));
    const completedTimers = Object.keys(timers).filter(id => timers[id].complete && !timers[id].dismissed);
    const dismissTimerAlert = () => setTimers(current => Object.keys(current).reduce((next, id) =>
        next[id].complete && !next[id].dismissed ? updateTimer(next, id, 'dismiss') : next, current));

    const updatePreference = (key, value) => setPreferences(previous => normalizePreferences({ ...previous, [key]: value }));

    const saveRecord = record => {
        const updated = [...history, { ...record, dateKey: localDateKey() }];
        localStorage.setItem('skctHistory', JSON.stringify(updated));
        savePlotHistory(updated);
        setHistory(updated);
    };

    const handleExit = () => setPendingAction('exit');
    const cancelPendingAction = () => setPendingAction(null);
    const confirmPendingAction = () => {
        if (pendingAction === 'exit') setGameState('START');
        if (pendingAction === 'clearHistory') {
            localStorage.removeItem('skctHistory');
            clearPlotHistory();
            setHistory([]);
        }
        setPendingAction(null);
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
    let screen = null;
    if (gameState === 'START') {
        screen = <StartScreen
                preferences={preferences}
                onPreferenceChange={updatePreference}
                onStart={handleStart}
                history={history}
                onClearHistory={() => setPendingAction('clearHistory')}
                timers={timers}
                onTimerAction={handleTimerAction}
            />;
    } else if (gameState === 'PLAYING') {
        if (examType === 'ADDITION') {
            screen = <CalculationTraining
                problems={sequenceProblems}
                calculatorUsed={preferences.calculatorUsed}
                onComplete={saveRecord}
                onRestart={() => setGameState('START')}
                onExit={handleExit}
            />;
        } else if (examType === 'SEQUENCE') {
            screen = <SequenceTraining
                    problems={sequenceProblems}
                    onComplete={saveRecord}
                    onRestart={() => setGameState('START')}
                    onExit={handleExit}
                />;
        } else if (isDataExam) {
            screen = <TablePlaying
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
                    onExit={handleExit}
                />;
        } else if (examType === 'PATTERN') {
            screen = <PatternPlaying
                    problemCount={problemCount}
                    patternProblems={patternProblems}
                    patternInputs={patternInputs}
                    onPatternChange={handlePatternChange}
                    onKeyDown={handleKeyDown}
                    onSubmit={handleNext}
                    inputRefs={inputRefs}
                    submitBtnRef={submitBtnRef}
                    onExit={handleExit}
                />;
        }
    } else if (gameState === 'RESULT') {
        screen = <ResultScreen
                examType={examType}
                results={results}
                sessionResult={sessionResult}
                totalRounds={totalRounds}
                problemCount={problemCount}
                onRestart={() => setGameState('START')}
            />;
    }

    return <>
        {gameState === 'PLAYING' ? <div className="playing-layout">
            <div className="playing-main">{screen}</div>
            <aside className="playing-tools" aria-label="훈련 풀이 도구">
                <PracticeToolStack active timers={timers} onTimerAction={handleTimerAction} />
            </aside>
        </div> : screen}
        {pendingAction && <ConfirmDialog
            title={pendingAction === 'exit' ? '훈련을 그만둘까요?' : '모든 기록을 초기화할까요?'}
            description={pendingAction === 'exit' ? '진행 중인 답안은 저장되지 않습니다.' : '저장된 훈련 기록과 결과 그래프가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.'}
            confirmLabel={pendingAction === 'exit' ? '그만두기' : '기록 삭제'}
            destructive={pendingAction === 'clearHistory'}
            onConfirm={confirmPendingAction}
            onCancel={cancelPendingAction}
        />}
        {completedTimers.length > 0 && <TimerAlert completed={completedTimers} onDismiss={dismissTimerAlert} />}
    </>;
};

export default App;

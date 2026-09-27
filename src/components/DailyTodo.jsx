import React, { useEffect, useState } from 'react';
import {
    MAX_TODO_COUNT, TODO_STORAGE_KEY, dailyTodoProgress, loadDailyTodo,
    localDateKey, normalizeDailyTodo, resizeDailyTodo, saveDailyTodo, toggleDailyTodo,
} from '../utils/dailyTodo.js';

export default function DailyTodo({ modes }) {
    const [todo, setTodo] = useState(loadDailyTodo);
    const { done, total } = dailyTodoProgress(todo);
    const [, month, day] = todo.date.split('-');

    useEffect(() => { saveDailyTodo(todo); }, [todo]);

    useEffect(() => {
        const refreshDay = () => {
            const today = localDateKey();
            setTodo(previous => previous.date === today ? previous : normalizeDailyTodo(previous, today));
        };
        const syncOtherTab = event => {
            if (event.key === TODO_STORAGE_KEY) setTodo(loadDailyTodo());
        };
        const timer = window.setInterval(refreshDay, 60_000);
        window.addEventListener('focus', refreshDay);
        window.addEventListener('storage', syncOtherTab);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', refreshDay);
            window.removeEventListener('storage', syncOtherTab);
        };
    }, []);

    return <section className="surface todo-panel" aria-labelledby="todo-heading">
        <div className="todo-heading-row">
            <h1 id="todo-heading">오늘의 Todo <span>{Number(month)}/{Number(day)}</span></h1>
            <span className="todo-total" aria-live="polite">{done} / {total} 완료</span>
        </div>
        <div className="todo-grid">
            {modes.map(mode => {
                const count = todo.counts[mode.id];
                return <div key={mode.id} className="todo-item">
                    <strong className="todo-item-name">{mode.name}</strong>
                    <div className="todo-checks" role="group" aria-label={`${mode.name} 완료 체크`}>
                        {todo.checked[mode.id].map((checked, index) => <label key={index} className={`todo-check ${checked ? 'checked' : ''}`}>
                            <input type="checkbox" checked={checked} aria-label={`${mode.name} ${index + 1}회 완료`}
                                onChange={() => setTodo(previous => toggleDailyTodo(previous, mode.id, index))} />
                        </label>)}
                    </div>
                    <div className="todo-adjust" role="group" aria-label={`${mode.name} 체크 칸 수`}>
                        <button type="button" aria-label={`${mode.name} 체크 칸 줄이기`} disabled={count <= 1}
                            onClick={() => setTodo(previous => resizeDailyTodo(previous, mode.id, previous.counts[mode.id] - 1))}>−</button>
                        <span>{count}</span>
                        <button type="button" aria-label={`${mode.name} 체크 칸 늘리기`} disabled={count >= MAX_TODO_COUNT}
                            onClick={() => setTodo(previous => resizeDailyTodo(previous, mode.id, previous.counts[mode.id] + 1))}>＋</button>
                    </div>
                </div>;
            })}
        </div>
    </section>;
}

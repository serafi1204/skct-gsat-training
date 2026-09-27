export const initialCalculator = Object.freeze({
    display: '0',
    previousResult: '',
    accumulator: null,
    operator: null,
    waiting: false,
    evaluated: false,
});

const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function calculatorExpression(state) {
    if (!state.operator || state.accumulator == null) return '';
    return `${state.accumulator} ${symbols[state.operator]}${state.waiting ? '' : ` ${state.display}`}`;
}

function formatNumber(value) {
    if (!Number.isFinite(value)) return '오류';
    return String(Number(value.toPrecision(12)));
}

function calculate(left, operator, right) {
    if (operator === '+') return left + right;
    if (operator === '-') return left - right;
    if (operator === '*') return left * right;
    if (operator === '/') return right === 0 ? NaN : left / right;
    return right;
}

export function calculatorInput(state, key) {
    if (key === 'C') return { ...initialCalculator };
    if (key === 'Backspace') {
        if (state.waiting || state.evaluated || state.display === '오류') return { ...state, display: '0', waiting: false, evaluated: false };
        const shortened = state.display.slice(0, -1);
        return { ...state, display: shortened && shortened !== '-' ? shortened : '0' };
    }
    if (/^\d$/.test(key)) {
        const fresh = state.waiting || state.evaluated || state.display === '오류';
        if (!fresh && state.display.replace(/[^\d]/g, '').length >= 14) return state;
        return { ...state, display: fresh || state.display === '0' ? key : state.display + key,
            accumulator: state.evaluated ? null : state.accumulator,
            operator: state.evaluated ? null : state.operator,
            waiting: false, evaluated: false };
    }
    if (key === '.') {
        if (state.waiting || state.evaluated || state.display === '오류') return { ...state, display: '0.', accumulator: state.evaluated ? null : state.accumulator, operator: state.evaluated ? null : state.operator, waiting: false, evaluated: false };
        return state.display.includes('.') ? state : { ...state, display: `${state.display}.` };
    }
    if (['+', '-', '*', '/'].includes(key)) {
        if (state.display === '오류') return state;
        const current = Number(state.display);
        const next = state.operator && !state.waiting ? calculate(state.accumulator, state.operator, current) : current;
        const display = formatNumber(next);
        if (display === '오류') return { ...initialCalculator, display, previousResult: state.previousResult };
        return { ...state, display, accumulator: Number(display), operator: key, waiting: true, evaluated: false };
    }
    if (key === '=') {
        if (!state.operator || state.waiting || state.display === '오류') return state;
        const result = formatNumber(calculate(state.accumulator, state.operator, Number(state.display)));
        const previousResult = `${formatNumber(state.accumulator)} ${symbols[state.operator]} ${state.display} = ${result}`;
        return { display: result, previousResult, accumulator: null, operator: null, waiting: false, evaluated: true };
    }
    return state;
}

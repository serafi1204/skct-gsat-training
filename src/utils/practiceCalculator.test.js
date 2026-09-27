import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatorExpression, calculatorInput, initialCalculator } from './practiceCalculator.js';

const enter = keys => [...keys].reduce(calculatorInput, { ...initialCalculator });

test('calculator performs four operations and retains only latest result', () => {
    let state = enter('12+3=');
    assert.equal(state.display, '15');
    assert.equal(state.previousResult, '12 + 3 = 15');
    state = ['4', '*', '2', '='].reduce(calculatorInput, state);
    assert.equal(state.display, '8');
    assert.equal(state.previousResult, '4 × 2 = 8');
    assert.equal(enter('8/2=').display, '4');
    assert.equal(enter('8-3=').display, '5');
});

test('calculator supports decimal, backspace, clear and division errors', () => {
    assert.equal(['1', '.', '2', 'Backspace', '3'].reduce(calculatorInput, { ...initialCalculator }).display, '1.3');
    assert.equal(enter('3/0=').display, '오류');
    assert.equal(['9', '+', '1', '=', 'C'].reduce(calculatorInput, { ...initialCalculator }).previousResult, '');
});

test('current expression tracks the pending operation separately from the prior result', () => {
    let state = enter('12+');
    assert.equal(calculatorExpression(state), '12 +');
    state = calculatorInput(state, '3');
    assert.equal(calculatorExpression(state), '12 + 3');
    state = calculatorInput(state, '=');
    assert.equal(calculatorExpression(state), '');
    assert.equal(state.previousResult, '12 + 3 = 15');
});

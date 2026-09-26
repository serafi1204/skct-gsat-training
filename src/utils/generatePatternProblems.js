/**
 * GSAT 규칙 찾기 문제 생성
 *
 * 문제 형태: input → ● → output (규칙 예시) / input → ● → ? (문제)
 * 각 요소는 4자리, 각 자리는 알파벳 또는 숫자로 표시
 *
 * 규칙 유형:
 * 1. 치환: 알파벳↔숫자 스왑 (A=1…I=9 제한 범위)
 * 2. 델타 패턴 (A-Z 전체 + 0-9, 순환 래핑):
 *    2-1: 동일 [k,k,k,k]
 *    2-2: 선형 [1,2,3,4] / [-1,-2,-3,-4]
 *    2-3: 반복 [a,b,a,b]
 *    2-4: 위 패턴에 부호교대 +-+- / -+-+
 */

// 기호 풀 (규칙 표시용)
const SYMBOLS = ['●', '◆', '■', '▲', '★', '◎', '▶', '♠', '♦', '♣', '♥', '○', '□', '△', '☆'];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const NONZERO_DELTAS = [-4, -3, -2, -1, 1, 2, 3, 4];
const POSITIVE_DELTAS = [1, 2, 3, 4];

// 숫자 래핑: 일의 자리 (mod 10). ex) 8+3=11→1, 2-4=-2→8
const wrapNumber = (value, delta) => ((value + delta) % 10 + 10) % 10;

// 알파벳 래핑: 순환 A-Z (mod 26). ex) Z+1→A, A-1→Z
const wrapLetter = (value, delta) => ((value - 1 + delta) % 26 + 26) % 26 + 1;

// 숫자 → 알파벳 변환 (전체 범위)
const numToLetter = (n) => String.fromCharCode(64 + n); // 1→A, 26→Z

// 치환 전용 매핑 (제한 범위)
const NUM_TO_LETTER_SUB = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'H', 9: 'I' };

/**
 * 델타 패턴 랜덤 생성
 * @returns {number[]} 길이 4의 델타 배열
 */
const generateDeltas = () => {
    const patternType = randPick(['2-1', '2-2', '2-3', '2-4a', '2-4b', '2-4c']);

    switch (patternType) {
        case '2-1': {
            const k = randPick(NONZERO_DELTAS);
            return [k, k, k, k];
        }
        case '2-2': {
            const sign = randPick([1, -1]);
            return [1 * sign, 2 * sign, 3 * sign, 4 * sign];
        }
        case '2-3': {
            const a = randPick(NONZERO_DELTAS);
            let b = randPick(NONZERO_DELTAS);
            while (b === a) b = randPick(NONZERO_DELTAS);
            return [a, b, a, b];
        }
        case '2-4a': {
            const k = randPick(POSITIVE_DELTAS);
            const s = randPick([1, -1]);
            return [k * s, k * -s, k * s, k * -s];
        }
        case '2-4b': {
            const s = randPick([1, -1]);
            return [1 * s, 2 * -s, 3 * s, 4 * -s];
        }
        case '2-4c': {
            let a = randPick(POSITIVE_DELTAS);
            let b = randPick(POSITIVE_DELTAS);
            while (b === a) b = randPick(POSITIVE_DELTAS);
            const s = randPick([1, -1]);
            return [a * s, b * -s, a * s, b * -s];
        }
        default:
            return [1, 1, 1, 1];
    }
};

/**
 * 델타 패턴 문제 생성 (A-Z 전체 + 0-9, 순환 래핑)
 */
const generateDeltaProblem = (symbol) => {
    const deltas = generateDeltas();

    // 각 위치의 타입 결정: true=알파벳, false=숫자
    const posTypes = Array.from({ length: 4 }, () => Math.random() < 0.5);

    // 규칙 예시 생성
    const ruleInput = posTypes.map((isLetter) =>
        isLetter ? randInt(1, 26) : randInt(0, 9)
    );
    const ruleOutput = ruleInput.map((v, i) =>
        posTypes[i] ? wrapLetter(v, deltas[i]) : wrapNumber(v, deltas[i])
    );

    // 문제 생성 (규칙 예시와 다른 시작값)
    let questionInput;
    let attempts = 0;
    do {
        questionInput = posTypes.map((isLetter) =>
            isLetter ? randInt(1, 26) : randInt(0, 9)
        );
        attempts++;
    } while (questionInput.every((v, i) => v === ruleInput[i]) && attempts < 50);

    const questionOutput = questionInput.map((v, i) =>
        posTypes[i] ? wrapLetter(v, deltas[i]) : wrapNumber(v, deltas[i])
    );

    // 포맷
    const fmt = (values) =>
        values.map((v, i) => (posTypes[i] ? numToLetter(v) : v.toString())).join('');

    return {
        symbol,
        rule: { input: fmt(ruleInput), output: fmt(ruleOutput) },
        question: { input: fmt(questionInput), answer: fmt(questionOutput) },
    };
};

/**
 * 치환 문제 생성 (알파벳↔숫자 스왑, A=1…I=9 제한 범위)
 */
const generateSubstitutionProblem = (symbol) => {

    // 입력 표현 패턴 (각 위치별 letter/number 랜덤)
    const inputRepr = Array.from({ length: 4 }, () => Math.random() < 0.5);
    const outputRepr = inputRepr.map((r) => !r); // 모든 위치 스왑

    // 값 생성 (1-9 범위)
    const ruleValues = Array.from({ length: 4 }, () => randInt(1, 9));
    let questionValues;
    let attempts = 0;
    do {
        questionValues = Array.from({ length: 4 }, () => randInt(1, 9));
        attempts++;
    } while (questionValues.every((v, i) => v === ruleValues[i]) && attempts < 50);

    // 포맷
    const fmt = (values, repr) =>
        values.map((v, i) => (repr[i] ? NUM_TO_LETTER_SUB[v] : v.toString())).join('');

    return {
        symbol,
        rule: {
            input: fmt(ruleValues, inputRepr),
            output: fmt(ruleValues, outputRepr),
        },
        question: {
            input: fmt(questionValues, inputRepr),
            answer: fmt(questionValues, outputRepr),
        },
    };
};

/**
 * 규칙 찾기 문제 배열 생성
 * @param {number} count - 문제 수
 * @returns {Array<{symbol: string, rule: {input, output}, question: {input, answer}}>}
 */
export const generatePatternProblems = (count = 20, { substitutionPercent = 15 } = {}) => {
    const problems = [];
    const numGroups = Math.ceil(count / 5);

    for (let g = 0; g < numGroups; g++) {
        const groupSymbols = [...SYMBOLS].sort(() => 0.5 - Math.random()).slice(0, 5);
        
        for (let i = 0; i < 5; i++) {
            if (problems.length >= count) break;
            
            const symbol = groupSymbols[i];
            if (Math.random() * 100 < substitutionPercent) {
                problems.push(generateSubstitutionProblem(symbol));
            } else {
                problems.push(generateDeltaProblem(symbol));
            }
        }
    }
    return problems;
};

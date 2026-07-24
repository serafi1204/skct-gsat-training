import { ROW_CATEGORIES, COL_CATEGORIES } from '../data/categories';

/**
 * 표 탐색 문제 생성
 * @param {boolean} isTwoTables - 2개 표 모드 여부
 * @returns {{ isTwoTables: boolean, tables: Array, questions: Array }}
 */
export const generateTableProblem = (isTwoTables) => {
    const numTables = isTwoTables ? 2 : 1;
    const tables = [];
    const randomRowCategory = ROW_CATEGORIES[Math.floor(Math.random() * ROW_CATEGORIES.length)];
    const randomColCategory = COL_CATEGORIES[Math.floor(Math.random() * COL_CATEGORIES.length)];
    const prefixes = isTwoTables ? ['국내총괄', '글로벌총괄'] : [''];
    const isTransposed = Math.random() < 0.5;

    for (let t = 0; t < numTables; t++) {
        const baseTitle = `${randomRowCategory.title} ${randomColCategory.title}`;
        const title = isTwoTables ? `${prefixes[t]} ${baseTitle}` : baseTitle;
        const template = {
            title,
            shortTitle: prefixes[t],
            rows: isTransposed ? randomColCategory.items : randomRowCategory.items,
            cols: isTransposed ? randomRowCategory.items : randomColCategory.items,
        };
        const data = [];
        for (let i = 0; i < template.rows.length; i++) {
            const rowData = [];
            for (let j = 0; j < template.cols.length; j++) {
                rowData.push(Math.floor(Math.random() * 8999) + 1000);
            }
            data.push(rowData);
        }
        tables.push({ template, data });
    }

    const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const questions = [];
    const usedKeys = new Set();
    while (questions.length < 4) {
        let key = '';
        let qObj = null;
        if (!isTwoTables) {
            const table = tables[0];
            const randType = Math.random();
            if (randType < 0.35) {
                // 동일 행 탐색
                const r = Math.floor(Math.random() * table.template.rows.length);
                const c1 = Math.floor(Math.random() * table.template.cols.length);
                let c2 = Math.floor(Math.random() * table.template.cols.length);
                while (c1 === c2) c2 = Math.floor(Math.random() * table.template.cols.length);
                key = `row-${r}-${c1}-${c2}`;
                const templates = [
                    `${table.template.cols[c1]} ${table.template.rows[r]}의 수치와 ${table.template.cols[c2]} 수치를 차례대로 적으시오.`,
                    `${table.template.cols[c1]}과 ${table.template.cols[c2]} ${table.template.rows[r]}의 수치를 차례대로 적으시오.`,
                    `${table.template.rows[r]}의 ${table.template.cols[c1]} 및 ${table.template.cols[c2]} 수치를 차례대로 적으시오.`,
                ];
                qObj = { text: randPick(templates), answer1: table.data[r][c1], answer2: table.data[r][c2] };
            } else if (randType < 0.70) {
                // 동일 열 탐색
                const c = Math.floor(Math.random() * table.template.cols.length);
                const r1 = Math.floor(Math.random() * table.template.rows.length);
                let r2 = Math.floor(Math.random() * table.template.rows.length);
                while (r1 === r2) r2 = Math.floor(Math.random() * table.template.rows.length);
                key = `col-${c}-${r1}-${r2}`;
                const templates = [
                    `${table.template.cols[c]} ${table.template.rows[r1]}와 ${table.template.rows[r2]}의 수치를 차례대로 적으시오.`,
                    `${table.template.cols[c]} ${table.template.rows[r1]}의 수치와 ${table.template.rows[r2]} 수치를 차례대로 적으시오.`,
                    `${table.template.rows[r1]}와 ${table.template.rows[r2]}의 ${table.template.cols[c]} 수치를 차례대로 적으시오.`,
                ];
                qObj = { text: randPick(templates), answer1: table.data[r1][c], answer2: table.data[r2][c] };
            } else if (randType < 0.85) {
                // 특정 행의 최대/최소값
                const r = Math.floor(Math.random() * table.template.rows.length);
                const isMax = Math.random() < 0.5;
                key = `maxmin_r-${r}-${isMax}`;
                const vals = table.data[r];
                const ans = isMax ? Math.max(...vals) : Math.min(...vals);
                const templates = [
                    `${table.template.rows[r]}에서 수치가 가장 ${isMax ? '큰' : '작은'} 항목의 값을 적으시오.`,
                    `${table.template.rows[r]} 항목 중 ${isMax ? '최고' : '최저'} 수치를 기록한 값을 적으시오.`,
                ];
                qObj = { text: randPick(templates), answer1: ans };
            } else {
                // 특정 열의 최대/최소값
                const c = Math.floor(Math.random() * table.template.cols.length);
                const isMax = Math.random() < 0.5;
                key = `maxmin_c-${c}-${isMax}`;
                const vals = table.data.map(row => row[c]);
                const ans = isMax ? Math.max(...vals) : Math.min(...vals);
                const templates = [
                    `${table.template.cols[c]} 기준 수치가 가장 ${isMax ? '큰' : '작은'} 항목의 값을 적으시오.`,
                    `${table.template.cols[c]} 동안 값이 가장 ${isMax ? '많은' : '적은'} 수치를 적으시오.`,
                ];
                qObj = { text: randPick(templates), answer1: ans };
            }
        } else {
            const type = Math.random();
            if (type < 0.5) {
                // 크로스 테이블 탐색
                const r = Math.floor(Math.random() * tables[0].template.rows.length);
                const c = Math.floor(Math.random() * tables[0].template.cols.length);
                key = `cross-${r}-${c}`;
                const short1 = tables[0].template.shortTitle;
                const short2 = tables[1].template.shortTitle;
                const templates = [
                    `${tables[0].template.cols[c]} ${tables[0].template.rows[r]}의 수치를 ${short1}와 ${short2}에서 차례대로 적으시오.`,
                    `${short1}와 ${short2}의 ${tables[0].template.cols[c]} ${tables[0].template.rows[r]} 수치를 차례대로 적으시오.`,
                    `${short1} ${tables[0].template.rows[r]}의 ${tables[0].template.cols[c]} 수치와 ${short2} 수치를 차례대로 적으시오.`,
                ];
                qObj = { text: randPick(templates), answer1: tables[0].data[r][c], answer2: tables[1].data[r][c] };
            } else {
                // 단일 표 내부 탐색
                const tIdx = Math.floor(Math.random() * 2);
                const table = tables[tIdx];
                const isSameRow = Math.random() < 0.5;
                if (isSameRow) {
                    const r = Math.floor(Math.random() * table.template.rows.length);
                    const c1 = Math.floor(Math.random() * table.template.cols.length);
                    let c2 = Math.floor(Math.random() * table.template.cols.length);
                    while (c1 === c2) c2 = Math.floor(Math.random() * table.template.cols.length);
                    key = `t${tIdx}-row-${r}-${c1}-${c2}`;
                    const templates = [
                        `${table.template.shortTitle} ${table.template.cols[c1]} ${table.template.rows[r]}의 수치와 ${table.template.cols[c2]} 수치를 차례대로 적으시오.`,
                        `${table.template.shortTitle} ${table.template.rows[r]}의 ${table.template.cols[c1]} 및 ${table.template.cols[c2]} 수치를 차례대로 적으시오.`,
                    ];
                    qObj = { text: randPick(templates), answer1: table.data[r][c1], answer2: table.data[r][c2] };
                } else {
                    const c = Math.floor(Math.random() * table.template.cols.length);
                    const r1 = Math.floor(Math.random() * table.template.rows.length);
                    let r2 = Math.floor(Math.random() * table.template.rows.length);
                    while (r1 === r2) r2 = Math.floor(Math.random() * table.template.rows.length);
                    key = `t${tIdx}-col-${c}-${r1}-${r2}`;
                    const templates = [
                        `${table.template.shortTitle} ${table.template.cols[c]} ${table.template.rows[r1]}와 ${table.template.rows[r2]}의 수치를 차례대로 적으시오.`,
                        `${table.template.shortTitle} ${table.template.rows[r1]}와 ${table.template.rows[r2]}의 ${table.template.cols[c]} 수치를 차례대로 적으시오.`,
                    ];
                    qObj = { text: randPick(templates), answer1: table.data[r1][c], answer2: table.data[r2][c] };
                }
            }
        }
        if (!usedKeys.has(key)) {
            usedKeys.add(key);
            questions.push(qObj);
        }
    }
    return { isTwoTables, tables, questions };
};

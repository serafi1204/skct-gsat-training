import React from 'react';

/**
 * 재사용 가능한 데이터 테이블 컴포넌트
 * @param {Object} props
 * @param {{ title: string, rows: string[], cols: string[] }} props.template - 표 구조
 * @param {number[][]} props.data - 표 데이터
 * @param {'normal' | 'small'} [props.size='normal'] - 표 크기 (결과 화면에서는 small)
 */
const DataTable = ({ template, data, size = 'normal' }) => {
    const isSmall = size === 'small';
    const textClass = isSmall ? 'text-xs' : 'text-sm';
    const cellClass = isSmall ? 'p-1' : 'p-1 px-2';

    return (
        <div className="question-card w-full">
            <h3 className={`font-bold ${isSmall ? 'text-sm mb-2' : 'text-base mb-3'}`}>
                {template.title}
            </h3>
            <div className="overflow-x-auto">
                <table className={`w-full border-collapse border border-slate-200 text-center whitespace-nowrap min-w-max ${textClass}`}>
                    <thead className="bg-teal-50">
                        <tr>
                            <th className={`border border-slate-200 ${cellClass} bg-teal-50 font-bold`}>구분</th>
                            {template.cols.map((col, idx) => (
                                <th key={idx} className={`border border-slate-200 ${cellClass} bg-teal-50 font-bold`}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {template.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                                <td className={`border border-slate-200 bg-slate-50 font-bold ${cellClass}`}>{row}</td>
                                {data[rIdx].map((val, cIdx) => (
                                    <td key={cIdx} className={`border border-slate-200 ${cellClass}`}>
                                        {val.toLocaleString()}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;

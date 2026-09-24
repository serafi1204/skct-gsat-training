import React, { useId } from 'react';

/** Rows are series; columns are x-axis categories. No hover highlighting or hidden labels. */
export default function LinePlot({ template, data, colors }) {
    const titleId = useId();
    const width = 760, height = 430;
    const left = 82, right = 42, top = 35, bottom = 48;
    const x = c => left + c * (width - left - right) / (template.cols.length - 1);
    const y = value => top + (10000 - value) * (height - top - bottom) / 10000;
    return (
        <figure className="bg-white border border-black p-3" aria-labelledby={titleId}>
            <figcaption id={titleId} className="text-center font-bold mb-2">{template.title}</figcaption>
            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[720px]" role="img" aria-labelledby={titleId}>
                    {[0, 2000, 4000, 6000, 8000, 10000].map(value => (
                        <g key={value}>
                            <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="#e5e5e5" />
                            <text x={left - 32} y={y(value) + 4} textAnchor="end" fontSize="12" fill="#555">{value.toLocaleString('en-US')}</text>
                        </g>
                    ))}
                    {data.map((row, r) => (
                        <polyline key={r} points={row.map((v, c) => `${x(c)},${y(v)}`).join(' ')} fill="none" stroke={colors[r]} strokeWidth="2.5" />
                    ))}
                    {data.flatMap((row, r) => row.map((value, c) => (
                        <g key={`${r}-${c}`}>
                            <circle cx={x(c)} cy={y(value)} r="4" fill={colors[r]} />
                            <text x={x(c)} y={y(value) - 10} textAnchor="middle" fontSize="13" fontWeight="600" fill="#222" stroke="white" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round">{value}</text>
                        </g>
                    )))}
                    {template.cols.map((label, c) => (
                        <text key={c} x={x(c)} y={height - 18} textAnchor="middle" fontSize="13" fill="#333">{label}</text>
                    ))}
                </svg>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2 text-sm" aria-label="범례">
                {template.rows.map((label, r) => (
                    <li key={label} className="flex items-center gap-2">
                        <svg width="36" height="14" aria-hidden="true">
                            <line x1="0" x2="36" y1="7" y2="7" stroke={colors[r]} strokeWidth="2.5" />
                            <circle cx="18" cy="7" r="4" fill={colors[r]} />
                        </svg>
                        <span>{label}</span>
                    </li>
                ))}
            </ul>
        </figure>
    );
}

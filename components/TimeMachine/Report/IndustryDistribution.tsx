
'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IndustryDistProps {
    data: { name: string, value: number }[];
    totalEmployees: number;
}

// Match reference "chart" colors
const COLORS = ["#1e3a5f", "#2c5282", "#3182ce", "#4299e1", "#63b3ed", "#90cdf4", "#bee3f8", "#e2e8f0"];

export function IndustryDistribution({ data, totalEmployees }: IndustryDistProps) {
    // Calculate percentage for table
    const tableData = data.map(d => ({
        ...d,
        percentage: totalEmployees > 0 ? ((d.value / totalEmployees) * 100).toFixed(1) : '0'
    }));

    return (
        <section className="mb-6 print:mb-6">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                三、行业分布分析
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8 mb-4">
                <div>
                    <h3 className="text-sm font-bold text-[#2c5282] mb-3">图3：各行业用工占比</h3>
                    <div className="h-[280px] sm:h-[300px] w-full border border-slate-100 bg-white">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => [val.toLocaleString() + '人', '用工规模']} />
                                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="text-xs text-gray-400">
                                    总用工
                                </text>
                                <text x="50%" y="49%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold text-[#1e3a5f]">
                                    {totalEmployees.toLocaleString()}
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-[#2c5282] mb-3 text-center">各行业用工详情</h3>
                    <div className="overflow-hidden border border-slate-200 rounded">
                        <table className="w-full text-xs">
                            <thead className="bg-[#1e3a5f] text-white">
                                <tr>
                                    <th className="p-2 text-left font-semibold">行业</th>
                                    <th className="p-2 text-right font-semibold">用工规模</th>
                                    <th className="p-2 text-right font-semibold">占比</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableData.slice(0, 10).map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">{row.name}</td>
                                        <td className="p-2 text-right font-mono">{row.value.toLocaleString()}</td>
                                        <td className="p-2 text-right">{row.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <p className="leading-relaxed text-sm text-gray-700">
                从行业分布来看，纺织服装产业作为我市支柱产业，吸纳就业人数最多。
                同时，以生物医药、电子信息为代表的新兴产业用工占比逐步提升，产业结构持续优化。
            </p>
        </section>
    );
}

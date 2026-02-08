
'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TalentProps {
    data: { type: string, count: number, percentage: number }[];
}

const COLORS = ["#1e3a5f", "#2c5282", "#3182ce", "#4299e1", "#63b3ed"];

export function TalentAnalysis({ data }: TalentProps) {
    return (
        <section className="mb-8 print:mb-12 page-break-inside-avoid">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                六、人才需求分析
            </h2>

            <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                    <h3 className="text-sm font-bold text-[#2c5282] mb-3">图6：急缺岗位类型分布</h3>
                    <div className="h-[250px] w-full border border-slate-100 bg-white">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="count"
                                    nameKey="type"
                                    label={({ type, percentage }: any) => `${type} ${percentage}%`}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => [val + '人', '缺口']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-[#2c5282] mb-3">表4：急缺岗位统计</h3>
                    <div className="overflow-hidden border border-slate-200 rounded">
                        <table className="w-full text-xs">
                            <thead className="bg-[#1e3a5f] text-white">
                                <tr>
                                    <th className="p-2 text-left font-semibold">岗位类型</th>
                                    <th className="p-2 text-right font-semibold">需求人数</th>
                                    <th className="p-2 text-right font-semibold">占比</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">{row.type}</td>
                                        <td className="p-2 text-right font-mono text-[#b8860b] font-bold">{row.count}</td>
                                        <td className="p-2 text-right">{row.percentage}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-bold">
                                    <td className="p-2">合计</td>
                                    <td className="p-2 text-right">{data.reduce((a, b) => a + b.count, 0)}</td>
                                    <td className="p-2 text-right">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <p className="leading-relaxed text-sm text-gray-700">
                从人才需求结构来看，<strong>普工</strong>需求依然占据主体地位，反映出劳动密集型产业的用工特性。
                <strong>技工</strong>需求紧随其后，表明企业对技能型人才的需求日益迫切。
                管理及其他岗位的需求相对平稳。
            </p>
        </section>
    );
}


'use client';

import React from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface TrendProps {
    data: any[];
}

const COLORS = {
    primary: "#1e3a5f",
    accent: "#b8860b",
    secondary: "#2c5282"
};

export function TrendAnalysis({ data }: TrendProps) {
    return (
        <section className="mb-8 print:mb-12 page-break-inside-avoid">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                二、月度趋势分析
            </h2>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-[#2c5282] mb-3">图1：2025年月度员工总数变化趋势</h3>
                <div className="h-[250px] w-full border border-slate-100 p-4 bg-white">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="total" name="员工总数" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: COLORS.primary }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#2c5282] mb-3">图2：2025年月度招聘与流失对比</h3>
                <div className="h-[250px] w-full border border-slate-100 p-4 bg-white">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="newHires" name="新招人数" fill={COLORS.primary} barSize={20} />
                            <Bar dataKey="attrition" name="流失人数" fill={COLORS.accent} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <p className="leading-relaxed text-sm text-gray-700">
                从月度趋势来看，用工规模呈现"稳中有升"的特点。年初受春节因素影响，招聘活动较为活跃。
                下半年随着订单趋稳，用工规模保持在较高水平。需关注流失人数较高的月份，分析具体原因并采取留人措施。
            </p>
        </section>
    );
}

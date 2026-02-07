'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface QuarterlyData {
    year: string;
    quarter: string;
    employees: number;
    recruited: number;
    resigned: number;
    shortage: number;
}

interface Props {
    data: QuarterlyData[];
}

export function QuarterlyPerformanceChart({ data }: Props) {
    // Prepare data with combined label
    // The data.quarter already comes as "Q1", "Q2" etc from the API? 
    // Let's check getQuarterlyBreakdown in lib/data.ts. 
    // parsed: const quarter = Math.ceil(month / 3); -> This is just a number 1, 2, 3, 4
    // key = `${year}-Q${quarter}`;
    // split: const [year, quarter] = key.split('-'); -> quarter is "Q1", "Q2" etc.
    // So data.quarter is "Q1".
    // label: `${d.year} ${d.quarter}` -> "2023 Q1". 
    // Wait, let's look at the user image. "2023 QQ1". 
    // This means data.quarter likely already has "Q" and we are adding another one, OR the split logic in data.ts is doing something different.

    // In lib/data.ts:
    // const key = `${year}-Q${quarter}`; // e.g. "2023-Q1"
    // const [year, quarter] = key.split('-'); // year="2023", quarter="Q1"
    // return { year, quarter, ... }

    // So data.quarter IS "Q1".
    // In this file: label: `${d.year} Q${d.quarter}` -> "2023 QQ1"
    // FIX: Change to `${d.year} ${d.quarter}`

    const chartData = data.map(d => ({
        ...d,
        label: `${d.year} ${d.quarter}`,
        shortageRate: d.employees > 0 ? (d.shortage / d.employees * 100).toFixed(1) : 0
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">季度效能概览</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        宏观查看各季度招聘与流失情况，以及缺工压力变化
                    </p>
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="label"
                            scale="band"
                            tick={{ fontSize: 12 }}
                            stroke="#64748b"
                        />
                        <YAxis
                            yAxisId="left"
                            label={{ value: '人数 (人)', angle: -90, position: 'insideLeft' }}
                            stroke="#64748b"
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{ value: '缺工 (人)', angle: 90, position: 'insideRight' }}
                            stroke="#f59e0b"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="recruited" name="新招人数" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="resigned" name="流失人数" fill="#ef4444" barSize={20} radius={[4, 4, 0, 0]} />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="shortage"
                            name="平均缺工"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#f59e0b' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Insight Footer */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                        <span className="font-medium text-slate-900 block mb-1">招聘旺季</span>
                        <span className="text-slate-600">
                            {findMaxQuarter(chartData, 'recruited')}
                        </span>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                        <span className="font-medium text-slate-900 block mb-1">流失高峰</span>
                        <span className="text-slate-600">
                            {findMaxQuarter(chartData, 'resigned')}
                        </span>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <span className="font-medium text-slate-900 block mb-1">缺工压力</span>
                        <span className="text-slate-600">
                            {findMaxQuarter(chartData, 'shortage')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function findMaxQuarter(data: any[], key: string) {
    if (!data.length) return '暂无数据';
    const max = data.reduce((prev, current) => (prev[key] > current[key]) ? prev : current);
    return `${max.label} (${max[key]})`;
}

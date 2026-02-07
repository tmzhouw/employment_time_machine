'use client';

import { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { TownStat } from '@/lib/data';

interface TownRankingProps {
    data: TownStat[];
}

export function TownRanking({ data }: TownRankingProps) {
    const [metric, setMetric] = useState<'employees' | 'shortage' | 'turnover'>('employees');

    const getMetricConfig = () => {
        switch (metric) {
            case 'employees':
                return {
                    key: 'totalEmployees',
                    label: '在岗人数',
                    color: '#3b82f6', // blue-500
                    formatter: (val: number) => val.toLocaleString() + '人'
                };
            case 'shortage':
                return {
                    key: 'shortageRate',
                    label: '缺工率',
                    color: '#ef4444', // red-500
                    formatter: (val: number) => val + '%'
                };
            case 'turnover':
                return {
                    key: 'turnoverRate',
                    label: '流失率',
                    color: '#f59e0b', // amber-500
                    formatter: (val: number) => val + '%'
                };
        }
    };

    const config = getMetricConfig();

    // Sort top 10 based on selected metric
    const sortedData = [...data]
        .sort((a, b) => (b as any)[config.key] - (a as any)[config.key])
        .slice(0, 10);

    return (
        <div className="h-[500px] w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">乡镇排行榜 (Top 10)</h3>

                {/* Metric Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMetric('employees')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'employees' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        规模
                    </button>
                    <button
                        onClick={() => setMetric('shortage')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'shortage' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        缺工率
                    </button>
                    <button
                        onClick={() => setMetric('turnover')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'turnover' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        流失率
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={sortedData}
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{ fontSize: 13, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: config.color, fontWeight: 600 }}
                            formatter={(value: number) => [config.formatter(value), config.label]}
                            labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Bar
                            dataKey={config.key}
                            fill={config.color}
                            radius={[0, 4, 4, 0]}
                            barSize={24}
                            background={{ fill: '#f8fafc', radius: [0, 4, 4, 0] }}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={config.color} fillOpacity={0.8 + (index * 0.02)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

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
import { IndustryStat } from '@/lib/data';
import { INDUSTRY_POLICY_ORDER } from '@/lib/constants';

interface IndustryRankingProps {
    data: IndustryStat[];
}

export function IndustryRanking({ data }: IndustryRankingProps) {
    const [metric, setMetric] = useState<'employees' | 'shortage' | 'turnover' | 'companies'>('employees');

    const getMetricConfig = () => {
        switch (metric) {
            case 'employees':
                return { key: 'totalEmployees', label: '在岗人数', color: '#6366f1', formatter: (val: number) => val.toLocaleString() + '人' };
            case 'shortage':
                return { key: 'shortageRate', label: '缺工率', color: '#ef4444', formatter: (val: number) => val.toFixed(2) + '%' };
            case 'turnover':
                return { key: 'turnoverRate', label: '流失率', color: '#f59e0b', formatter: (val: number) => val.toFixed(2) + '%' };
            case 'companies':
                return { key: 'companyCount', label: '企业数量', color: '#10b981', formatter: (val: number) => val + '家' };
        }
    };

    const config = getMetricConfig();

    // Sort by "一主两新三支撑" policy order
    const sortedData = [...data].sort((a, b) => {
        const idxA = INDUSTRY_POLICY_ORDER.indexOf(a.name);
        const idxB = INDUSTRY_POLICY_ORDER.indexOf(b.name);
        const orderA = idxA === -1 ? INDUSTRY_POLICY_ORDER.length : idxA;
        const orderB = idxB === -1 ? INDUSTRY_POLICY_ORDER.length : idxB;
        return orderA - orderB;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col" style={{ height: '500px' }}>
            <div className="mb-6 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-900">行业排行榜</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {[
                        { key: 'employees' as const, label: '规模', color: 'text-indigo-600' },
                        { key: 'shortage' as const, label: '缺工', color: 'text-red-600' },
                        { key: 'turnover' as const, label: '流失', color: 'text-amber-600' },
                        { key: 'companies' as const, label: '企业', color: 'text-emerald-600' },
                    ].map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => setMetric(btn.key)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === btn.key ? `bg-white ${btn.color} shadow-sm` : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={sortedData}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: config.color, fontWeight: 600 }}
                            formatter={(value: any) => [config.formatter(value as number), config.label]}
                            labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Bar
                            dataKey={config.key}
                            fill={config.color}
                            radius={[0, 6, 6, 0]}
                            barSize={22}
                            background={{ fill: '#f8fafc', radius: [0, 6, 6, 0] } as any}
                        >
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={config.color} fillOpacity={1 - (index * 0.06)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

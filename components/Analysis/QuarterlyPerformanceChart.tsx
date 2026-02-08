'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const chartData = data.map(d => ({
        ...d,
        label: `${d.year} ${d.quarter}`,
        // Mobile: show only "Q1" style labels to save space
        shortLabel: d.quarter,
        shortageRate: d.employees > 0 ? (d.shortage / d.employees * 100).toFixed(1) : 0
    }));

    // Group by year for reference lines / understanding
    const years = [...new Set(data.map(d => d.year))];

    const margin = isMobile
        ? { top: 10, right: 5, bottom: 5, left: 0 }
        : { top: 20, right: 20, bottom: 20, left: 20 };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-6">
                <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">季度效能概览</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">
                        各季度招聘与流失情况，以及缺工压力变化
                    </p>
                </div>
                {/* Year badges */}
                <div className="flex gap-1">
                    {years.map(y => (
                        <span key={y} className="text-[10px] md:text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            {y}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ width: '100%', height: isMobile ? 280 : 400 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <ComposedChart data={chartData} margin={margin}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey={isMobile ? "shortLabel" : "label"}
                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
                            stroke="#e2e8f0"
                            interval={0}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#e2e8f0"
                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
                            width={isMobile ? 35 : 50}
                            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                            label={isMobile ? undefined : {
                                value: '人数',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fill: '#94a3b8', fontSize: 11 }
                            }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#e2e8f0"
                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#f59e0b' }}
                            width={isMobile ? 30 : 45}
                            label={isMobile ? undefined : {
                                value: '缺工',
                                angle: 90,
                                position: 'insideRight',
                                style: { fill: '#f59e0b', fontSize: 11 }
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.97)',
                                borderRadius: '10px',
                                border: 'none',
                                boxShadow: '0 4px 20px rgb(0 0 0 / 0.12)',
                                padding: '10px 14px',
                                fontSize: 13,
                            }}
                            labelStyle={{ fontWeight: 600, marginBottom: 4, color: '#1e293b' }}
                            formatter={(value: any, name?: string) => {
                                return [typeof value === 'number' ? value.toLocaleString() : value, name];
                            }}
                        />
                        <Legend
                            iconSize={isMobile ? 10 : 14}
                            wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: 8 }}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="recruited"
                            name="新招人数"
                            fill="#10b981"
                            barSize={isMobile ? 10 : 18}
                            radius={[3, 3, 0, 0]}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="resigned"
                            name="流失人数"
                            fill="#ef4444"
                            barSize={isMobile ? 10 : 18}
                            radius={[3, 3, 0, 0]}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="shortage"
                            name="平均缺工"
                            stroke="#f59e0b"
                            strokeWidth={isMobile ? 2 : 3}
                            dot={{
                                r: isMobile ? 3 : 5,
                                fill: '#f59e0b',
                                strokeWidth: 2,
                                stroke: '#fff'
                            }}
                            activeDot={{ r: isMobile ? 5 : 7 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Insight Footer */}
            <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-start gap-1.5 md:gap-3 p-2 md:p-3 bg-emerald-50/50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="font-medium text-slate-900 block mb-0.5">招聘旺季</span>
                        <span className="text-slate-600 text-[10px] md:text-xs truncate block">
                            {findMaxQuarter(chartData, 'recruited')}
                        </span>
                    </div>
                </div>
                <div className="flex items-start gap-1.5 md:gap-3 p-2 md:p-3 bg-red-50/50 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="font-medium text-slate-900 block mb-0.5">流失高峰</span>
                        <span className="text-slate-600 text-[10px] md:text-xs truncate block">
                            {findMaxQuarter(chartData, 'resigned')}
                        </span>
                    </div>
                </div>
                <div className="flex items-start gap-1.5 md:gap-3 p-2 md:p-3 bg-amber-50/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="font-medium text-slate-900 block mb-0.5">缺工压力</span>
                        <span className="text-slate-600 text-[10px] md:text-xs truncate block">
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

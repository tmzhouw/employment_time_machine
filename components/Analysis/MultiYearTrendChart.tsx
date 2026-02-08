'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Users, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface MultiYearTrendPoint {
    month: string;
    monthLabel: string;
    employees: number;
    shortage: number;
    recruited: number;
    resigned: number;
}

interface MultiYearTrendChartProps {
    data: MultiYearTrendPoint[];
}

type MetricType = 'employees' | 'shortage' | 'recruited' | 'resigned';

interface MetricConfig {
    label: string;
    color: string;
    icon: any;
    yAxisLabel: string;
    domain?: (number | string)[];
    ticks?: number[];
}

const METRIC_CONFIG: Record<string, MetricConfig> = {
    employees: {
        label: '在岗人数',
        color: '#3b82f6', // blue-500
        icon: Users,
        yAxisLabel: '人数 (人)',
        domain: [22000, 26000],
        ticks: [22000, 23000, 24000, 25000, 26000]
    },
    shortage: {
        label: '缺工人数',
        color: '#f59e0b', // amber-500
        icon: AlertCircle,
        yAxisLabel: '缺工 (人)',
        domain: [0, 'auto']
    },
    recruited: {
        label: '新招人数',
        color: '#10b981', // green-500
        icon: TrendingUp,
        yAxisLabel: '新招 (人)',
        domain: [0, 'auto']
    },
    resigned: {
        label: '流失人数',
        color: '#ef4444', // red-500
        icon: TrendingDown,
        yAxisLabel: '流失 (人)',
        domain: [0, 'auto']
    }
};

export function MultiYearTrendChart({ data }: MultiYearTrendChartProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('employees');

    const config = METRIC_CONFIG[selectedMetric];
    const Icon = config.icon;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-6">
            {/* Header with Metric Selector */}
            <div className="flex items-center justify-between mb-3 md:mb-6">
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: config.color }} />
                    <h2 className="text-sm md:text-lg font-semibold text-slate-900">
                        <span className="hidden md:inline">多年趋势 - </span>{config.label}
                    </h2>
                </div>

                {/* Metric Toggle Buttons */}
                <div className="flex gap-1.5 md:gap-2 overflow-x-auto">
                    {(Object.keys(METRIC_CONFIG) as MetricType[]).map((metric) => {
                        const metricConfig = METRIC_CONFIG[metric];
                        const MetricIcon = metricConfig.icon;
                        const isActive = selectedMetric === metric;

                        return (
                            <button
                                key={metric}
                                onClick={() => setSelectedMetric(metric)}
                                className={`
                                    px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium
                                    transition-all duration-200
                                    flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }
                                `}
                            >
                                <MetricIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">{metricConfig.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="monthLabel"
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        label={{ value: config.yAxisLabel, angle: -90, position: 'insideLeft' }}
                        domain={config.domain as [number | string, number | string]}
                        ticks={config.ticks}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            padding: '12px'
                        }}
                        formatter={(value) => {
                            if (typeof value === 'number') {
                                return [value.toLocaleString() + ' 人', config.label];
                            }
                            return [String(value), config.label];
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke={config.color}
                        strokeWidth={3}
                        dot={{ fill: config.color, r: 4 }}
                        activeDot={{ r: 6 }}
                        name={config.label}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Footer Stats */}
            <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2 md:mb-4">
                    <span className="text-xs md:text-sm font-medium text-slate-500">
                        截至 {data[data.length - 1]?.monthLabel || '当前'}
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    {(['employees', 'shortage', 'recruited', 'resigned'] as MetricType[]).map((metric) => {
                        const latestData = data[data.length - 1];
                        const latestValue = latestData?.[metric] || 0;
                        const metricConfig = METRIC_CONFIG[metric];

                        // Logic for Recruited/Resigned: Show Monthly + YTD
                        if (metric === 'recruited' || metric === 'resigned') {
                            const currentYear = latestData?.month?.substring(0, 4);
                            const ytdTotal = data
                                .filter(d => d.month.startsWith(currentYear))
                                .reduce((sum, d) => sum + (d[metric] || 0), 0);

                            return (
                                <div key={metric} className="bg-slate-50 rounded-xl p-2.5 md:p-4 text-center">
                                    <p className="text-[10px] md:text-xs text-slate-500 mb-0.5 md:mb-1">{metricConfig.label}</p>
                                    <p className="text-base md:text-2xl font-bold text-slate-900">
                                        {latestValue.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
                                        累计 {ytdTotal.toLocaleString()}
                                    </p>
                                </div>
                            );
                        }

                        // Logic for Employees/Shortage: Show Snapshot + Growth (YTD)
                        const currentYear = latestData?.month?.substring(0, 4);
                        const startOfYearData = data.find(d => d.month.startsWith(currentYear)) || data[0];
                        const startValue = startOfYearData?.[metric] || 0;

                        const change = latestValue - startValue;
                        const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

                        return (
                            <div key={metric} className="bg-slate-50 rounded-xl p-2.5 md:p-4 text-center">
                                <p className="text-[10px] md:text-xs text-slate-500 mb-0.5 md:mb-1">{metricConfig.label}</p>
                                <p className="text-base md:text-2xl font-bold text-slate-900">
                                    {latestValue.toLocaleString()}
                                </p>
                                <p className={`text-[10px] md:text-xs mt-0.5 md:mt-1 flex items-center justify-center gap-0.5 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span>{change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
                                    <span className="text-slate-400">(较年初)</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* Header with Metric Selector */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                    <h2 className="text-lg font-semibold text-slate-900">
                        多年趋势 - {config.label}
                    </h2>
                </div>

                {/* Metric Toggle Buttons */}
                <div className="flex gap-2">
                    {(Object.keys(METRIC_CONFIG) as MetricType[]).map((metric) => {
                        const metricConfig = METRIC_CONFIG[metric];
                        const MetricIcon = metricConfig.icon;
                        const isActive = selectedMetric === metric;

                        return (
                            <button
                                key={metric}
                                onClick={() => setSelectedMetric(metric)}
                                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium
                                    transition-all duration-200
                                    flex items-center gap-2
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }
                                `}
                            >
                                <MetricIcon className="w-4 h-4" />
                                {metricConfig.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                {(['employees', 'shortage', 'recruited', 'resigned'] as MetricType[]).map((metric) => {
                    const latestValue = data[data.length - 1]?.[metric] || 0;
                    const earliestValue = data[0]?.[metric] || 0;
                    const change = latestValue - earliestValue;
                    const changePercent = earliestValue > 0 ? (change / earliestValue) * 100 : 0;
                    const metricConfig = METRIC_CONFIG[metric];

                    return (
                        <div key={metric} className="text-center">
                            <p className="text-xs text-slate-500 mb-1">{metricConfig.label}</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {latestValue.toLocaleString()}
                            </p>
                            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

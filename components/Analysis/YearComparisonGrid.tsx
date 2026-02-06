'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface YearMetrics {
    avgEmployees: number;
    totalRecruited: number;
    totalResigned: number;
    avgShortage: number;
    growthRate: number | null;
}

interface YearOverYearData {
    [year: string]: YearMetrics;
}

interface YearComparisonGridProps {
    data: YearOverYearData;
}

export function YearComparisonGrid({ data }: YearComparisonGridProps) {
    const years = Object.keys(data).sort();

    // Prepare data for mini charts
    const chartData = years.map((year) => ({
        year,
        employees: data[year].avgEmployees
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">年度对比</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {years.map((year) => {
                    const metrics = data[year];
                    const hasGrowth = metrics.growthRate !== null;

                    return (
                        <div
                            key={year}
                            className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200"
                        >
                            {/* Year Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-slate-900">{year}年</h3>
                                {hasGrowth && (
                                    <div
                                        className={`
                                            px-3 py-1 rounded-full text-sm font-semibold
                                            ${metrics.growthRate! >= 0
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }
                                        `}
                                    >
                                        {metrics.growthRate! >= 0 ? '+' : ''}
                                        {metrics.growthRate!.toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            {/* Mini Sparkline */}
                            <div className="mb-4 h-16">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[{ year, value: metrics.avgEmployees }]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <Bar
                                            dataKey="value"
                                            fill={
                                                year === '2023' ? '#3b82f6' :
                                                    year === '2024' ? '#8b5cf6' :
                                                        '#f59e0b'
                                            }
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Metrics Grid */}
                            <div className="space-y-3">
                                {/* Average Employees */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm">平均在岗</span>
                                    </div>
                                    <span className="font-semibold text-slate-900">
                                        {metrics.avgEmployees.toLocaleString()}
                                    </span>
                                </div>

                                {/* Total Recruited */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-sm">累计新招</span>
                                    </div>
                                    <span className="font-semibold text-green-700">
                                        {metrics.totalRecruited.toLocaleString()}
                                    </span>
                                </div>

                                {/* Total Resigned */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="text-sm">累计流失</span>
                                    </div>
                                    <span className="font-semibold text-red-700">
                                        {metrics.totalResigned.toLocaleString()}
                                    </span>
                                </div>

                                {/* Average Shortage */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm">平均缺工</span>
                                    </div>
                                    <span className="font-semibold text-amber-700">
                                        {metrics.avgShortage.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

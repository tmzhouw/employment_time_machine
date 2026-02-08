'use client';

import { Users, TrendingUp, TrendingDown, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

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

// Color palette for each year
const YEAR_COLORS: Record<string, { bg: string; bar: string; text: string; ring: string }> = {
    '2023': { bg: 'bg-blue-50', bar: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-200' },
    '2024': { bg: 'bg-violet-50', bar: 'bg-violet-500', text: 'text-violet-700', ring: 'ring-violet-200' },
    '2025': { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-50', bar: 'bg-slate-500', text: 'text-slate-700', ring: 'ring-slate-200' };

function GrowthBadge({ rate }: { rate: number | null }) {
    if (rate === null) return <span className="text-xs text-slate-400">基准年</span>;
    const isUp = rate >= 0;
    return (
        <span className={`
            inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
            ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
        `}>
            {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{rate.toFixed(1)}%
        </span>
    );
}

export function YearComparisonGrid({ data }: YearComparisonGridProps) {
    const years = Object.keys(data).sort();

    // Find max values for proportional bars
    const maxEmployees = Math.max(...years.map(y => data[y].avgEmployees));
    const maxRecruited = Math.max(...years.map(y => data[y].totalRecruited));
    const maxResigned = Math.max(...years.map(y => data[y].totalResigned));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-5">年度对比</h2>

            {/* ===== Mobile: Compact comparison table ===== */}
            <div className="block md:hidden">
                {/* Header row with year labels */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {years.map(year => {
                        const c = YEAR_COLORS[year] || DEFAULT_COLOR;
                        const metrics = data[year];
                        return (
                            <div key={year} className={`${c.bg} rounded-lg p-2.5 text-center ring-1 ${c.ring}`}>
                                <div className={`text-lg font-bold ${c.text}`}>{year}</div>
                                <GrowthBadge rate={metrics.growthRate} />
                            </div>
                        );
                    })}
                </div>

                {/* Metric rows */}
                {[
                    { key: 'avgEmployees' as const, label: '平均在岗', icon: Users, color: 'text-slate-600', valueColor: 'text-slate-900', max: maxEmployees },
                    { key: 'totalRecruited' as const, label: '累计新招', icon: TrendingUp, color: 'text-emerald-600', valueColor: 'text-emerald-700', max: maxRecruited },
                    { key: 'totalResigned' as const, label: '累计流失', icon: TrendingDown, color: 'text-red-500', valueColor: 'text-red-600', max: maxResigned },
                    { key: 'avgShortage' as const, label: '平均缺工', icon: AlertCircle, color: 'text-amber-500', valueColor: 'text-amber-600', max: null },
                ].map(({ key, label, icon: Icon, color, valueColor, max }) => (
                    <div key={key} className="mb-2">
                        <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{label}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {years.map(year => {
                                const val = data[year][key];
                                const c = YEAR_COLORS[year] || DEFAULT_COLOR;
                                const pct = max ? Math.round((val / max) * 100) : 0;
                                return (
                                    <div key={year} className="text-center">
                                        <div className={`text-sm font-bold ${valueColor}`}>
                                            {val.toLocaleString()}
                                        </div>
                                        {max && (
                                            <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${c.bar} rounded-full transition-all duration-500`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Net change row */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                        <Minus className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">净增减</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {years.map(year => {
                            const net = data[year].totalRecruited - data[year].totalResigned;
                            const isPositive = net >= 0;
                            return (
                                <div key={year} className="text-center">
                                    <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : ''}{net.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ===== Desktop: Card grid ===== */}
            <div className="hidden md:grid md:grid-cols-3 gap-5">
                {years.map((year) => {
                    const metrics = data[year];
                    const c = YEAR_COLORS[year] || DEFAULT_COLOR;
                    const empPct = Math.round((metrics.avgEmployees / maxEmployees) * 100);
                    const net = metrics.totalRecruited - metrics.totalResigned;

                    return (
                        <div
                            key={year}
                            className={`rounded-xl p-5 ring-1 ${c.ring} ${c.bg} hover:shadow-md transition-all duration-200`}
                        >
                            {/* Year Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-2xl font-bold ${c.text}`}>{year}年</h3>
                                <GrowthBadge rate={metrics.growthRate} />
                            </div>

                            {/* Employee bar */}
                            <div className="mb-4">
                                <div className="flex items-baseline justify-between mb-1.5">
                                    <span className="text-xs text-slate-500">平均在岗规模</span>
                                    <span className={`text-xl font-bold ${c.text}`}>
                                        {metrics.avgEmployees.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${c.bar} rounded-full transition-all duration-700`}
                                        style={{ width: `${empPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-sm">累计新招</span>
                                    </div>
                                    <span className="font-semibold text-emerald-700">
                                        {metrics.totalRecruited.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-red-500">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="text-sm">累计流失</span>
                                    </div>
                                    <span className="font-semibold text-red-600">
                                        {metrics.totalResigned.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm">平均缺工</span>
                                    </div>
                                    <span className="font-semibold text-amber-600">
                                        {metrics.avgShortage.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Net change footer */}
                            <div className="mt-3 pt-3 border-t border-white/50 flex items-center justify-between">
                                <span className="text-xs text-slate-500">净增减</span>
                                <span className={`text-sm font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {net >= 0 ? '+' : ''}{net.toLocaleString()} 人
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

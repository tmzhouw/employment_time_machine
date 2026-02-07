'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { X, Building2, MapPin, User, Phone, TrendingUp, AlertCircle, Users, ArrowUpRight, ArrowDownRight, Calendar, Activity, Zap } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area } from "recharts";
import { useEffect, useRef, useState, useMemo } from "react";
import { fetchCompanyHistoryAction } from "@/app/actions";
import { CompanyHistoryRecord, CompanyHistoryResponse } from "@/lib/data";
import clsx from "clsx";

export function EnterpriseDetailModal({ data: initialData }: { data: any }) {
    const router = useRouter();
    const [companyData, setCompanyData] = useState<CompanyHistoryResponse | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Extract available years from history
    const availableYears = useMemo(() => {
        if (!companyData?.history.length) return [];
        const years = new Set(companyData.history.map(d => d.report_month.substring(0, 4)));
        return Array.from(years).sort();
    }, [companyData]);

    const searchParams = useSearchParams();
    const companyName = searchParams.get('company');
    const isOpen = !!companyName;
    const modalRef = useRef<HTMLDivElement>(null);

    // Initial load of history data
    useEffect(() => {
        if (isOpen && companyName) {
            setIsLoadingHistory(true);
            fetchCompanyHistoryAction(companyName)
                .then((response: CompanyHistoryResponse) => {
                    setCompanyData(response);
                    // Default to LATEST year if available
                    if (response.history.length > 0) {
                        const years = Array.from(new Set(response.history.map((d: CompanyHistoryRecord) => d.report_month.substring(0, 4)))).sort();
                        setSelectedYear(years[years.length - 1]); // Use latest year
                    }
                })
                .finally(() => setIsLoadingHistory(false));
        }
    }, [isOpen, companyName]);

    // Process data for the selected year
    const currentYearData = useMemo(() => {
        if (!companyData?.history.length) return [];
        return companyData.history.filter(d => d.report_month.startsWith(selectedYear));
    }, [companyData, selectedYear]);

    const prevYearData = useMemo(() => {
        if (!companyData?.history.length || selectedYear === availableYears[0]) return [];
        const prevYear = String(Number(selectedYear) - 1);
        return companyData.history.filter(d => d.report_month.startsWith(prevYear));
    }, [companyData, selectedYear, availableYears]);

    // Calculate stats and YoY
    const stats = useMemo(() => {
        // Current Year Stats
        const currentRecruited = currentYearData.reduce((sum, d) => sum + d.recruited_new, 0);
        const currentResigned = currentYearData.reduce((sum, d) => sum + d.resigned_total, 0);
        const currentNetGrowth = currentRecruited - currentResigned;
        const maxShortage = Math.max(...currentYearData.map(d => d.shortage_total), 0);

        // Prev Year Stats (for YoY)
        const prevRecruited = prevYearData.reduce((sum, d) => sum + d.recruited_new, 0);
        const prevResigned = prevYearData.reduce((sum, d) => sum + d.resigned_total, 0);

        const calcYoY = (curr: number, prev: number) => {
            if (!prev) return null;
            return ((curr - prev) / prev * 100).toFixed(1);
        };

        return {
            netGrowth: currentNetGrowth,
            totalRecruited: currentRecruited,
            totalResigned: currentResigned,
            maxShortage,
            yoyRecruited: calcYoY(currentRecruited, prevRecruited),
            yoyResigned: calcYoY(currentResigned, prevResigned)
        };
    }, [currentYearData, prevYearData]);

    // Combine data for charts (Current vs Previous)
    const chartData = useMemo(() => {
        // Create 1-12 months structure
        return Array.from({ length: 12 }, (_, i) => {
            const monthStr = String(i + 1).padStart(2, '0');
            // Fix: Check the month part (YYYY-MM-DD), so indices 5-7
            const currentRecord = currentYearData.find(d => d.report_month.substring(5, 7) === monthStr);
            const prevRecord = prevYearData.find(d => d.report_month.substring(5, 7) === monthStr);

            return {
                month: `${monthStr}月`,
                rawMonth: monthStr,
                employees: currentRecord?.employees_total,
                projects_prev: prevRecord?.employees_total, // "projects" is a typo fix? No, let's call it employees_prev
                employees_prev: prevRecord?.employees_total,
                shortage: currentRecord?.shortage_total,
                recruited: currentRecord?.recruited_new,
                resigned: currentRecord?.resigned_total,
                net_growth: (currentRecord?.recruited_new || 0) - (currentRecord?.resigned_total || 0)
            };
        });
    }, [currentYearData, prevYearData]);

    // Auto-Profiling Logic
    const profilingTags = useMemo(() => {
        const tags = [];
        // 1. Growth
        if (stats.netGrowth > 0 && (currentYearData[0]?.employees_total || 0) > 0 && stats.netGrowth / currentYearData[0].employees_total > 0.05) {
            tags.push({ label: '稳健增长', color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp });
        }
        // 2. High Turnover via Resignation comparison
        if (stats.totalResigned > stats.totalRecruited * 1.2) {
            tags.push({ label: '流失风险', color: 'bg-rose-100 text-rose-700', icon: AlertCircle });
        }
        // 3. Seasonal (Simple variance check on recruited)
        const recruited = currentYearData.map(d => d.recruited_new);
        if (recruited.length > 0) {
            const max = Math.max(...recruited);
            const mean = recruited.reduce((a, b) => a + b, 0) / recruited.length;
            if (max > mean * 2.5) { // Peak is 2.5x average
                tags.push({ label: '季节性强', color: 'bg-amber-100 text-amber-700', icon: Zap });
            }
        }
        return tags;
    }, [stats, currentYearData]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Close function: remove query param
    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('company');
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    if (!isOpen || !companyName) return null;

    // Use fetched company info or show loading state
    const companyInfo = companyData?.info || initialData?.info || {
        name: companyName,
        industry: '加载中...',
        town: '加载中...',
        contact_person: null,
        contact_phone: null
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div
                ref={modalRef}
                className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">{companyInfo.name}</h2>
                                <div className="flex gap-2">
                                    {profilingTags.map((tag, i) => (
                                        <span key={i} className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded font-medium ${tag.color}`}>
                                            <tag.icon size={12} />
                                            {tag.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mt-3 text-slate-300 text-sm">
                                <div className="flex items-center gap-1.5"><Building2 size={14} /> {companyInfo.industry}</div>
                                <div className="flex items-center gap-1.5"><MapPin size={14} /> {companyInfo.town}</div>
                                <div className="flex items-center gap-1.5"><User size={14} /> {companyInfo.contact_person || '未登记'}</div>
                                <div className="flex items-center gap-1.5"><Phone size={14} /> {companyInfo.contact_phone || '-'}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={24} className="text-white/70 hover:text-white" />
                        </button>
                    </div>

                    {/* Year Selector Tabs */}
                    <div className="flex mt-8 gap-1 border-b border-white/10">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2",
                                    selectedYear === year
                                        ? "bg-white text-slate-900"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Calendar size={14} />
                                {year}档案
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto p-6 space-y-6 bg-slate-50 flex-1">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="年度净增长"
                            value={stats.netGrowth > 0 ? `+${stats.netGrowth}` : stats.netGrowth}
                            unit="人"
                            icon={<TrendingUp className={stats.netGrowth >= 0 ? "text-emerald-500" : "text-rose-500"} />}
                            trend={stats.netGrowth >= 0 ? "positive" : "negative"}
                            sub="基于当年累计"
                        />
                        <StatCard
                            label="缺工峰值"
                            value={stats.maxShortage}
                            unit="人"
                            icon={<AlertCircle className="text-orange-500" />}
                            sub="年度最高缺口"
                        />
                        <StatCard
                            label="累计新招"
                            value={stats.totalRecruited}
                            unit="人"
                            icon={<ArrowUpRight className="text-blue-500" />}
                            yoy={stats.yoyRecruited}
                        />
                        <StatCard
                            label="累计流失"
                            value={stats.totalResigned}
                            unit="人"
                            icon={<ArrowDownRight className="text-slate-500" />}
                            yoy={stats.yoyResigned}
                            inverseTrend // For resigned, increase is bad (usually, but let's keep neutral color for now or specific logic)
                        />
                    </div>

                    {/* Chart 1: Employment Comparison */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Activity className="text-blue-600" size={20} />
                                用工走势对比 (VS 去年)
                            </h3>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    <span className="text-gray-600">{selectedYear} 在岗</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full border border-slate-400 border-dashed"></span>
                                    <span className="text-gray-400">{parseInt(selectedYear) - 1} 同期</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip currentYear={selectedYear} prevYear={(parseInt(selectedYear) - 1).toString()} />} />

                                    {/* Previous Year (Shadow) */}
                                    <Line
                                        type="monotone"
                                        dataKey="employees_prev"
                                        stroke="#94a3b8"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name={`${parseInt(selectedYear) - 1} 在岗`}
                                    />

                                    {/* Current Year */}
                                    <Line
                                        type="monotone"
                                        dataKey="employees"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                                        activeDot={{ r: 6, fill: '#3b82f6' }}
                                        name={`${selectedYear} 在岗`}
                                    />

                                    {/* Shortage Area */}
                                    <Area
                                        type="monotone"
                                        dataKey="shortage"
                                        fill="#fecaca"
                                        stroke="#f87171"
                                        fillOpacity={0.2}
                                        name="当前缺工"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Flux */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Users className="text-indigo-600" size={20} />
                            人员流动监测 ({selectedYear})
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} stackOffset="sign">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="recruited" name="新招" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="resigned" name="流失" fill="#f59e0b" barSize={20} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="net_growth" name="净增" stroke="#6366f1" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
            {/* Backdrop Close Layer */}
            <div className="absolute inset-0 -z-10" onClick={handleClose} />
        </div>
    );
}

function StatCard({ label, value, unit, icon, sub, trend, yoy, inverseTrend }: any) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-sm font-medium">{label}</span>
                {icon}
            </div>
            <div>
                <div className={clsx("text-2xl font-bold font-mono tracking-tight", {
                    "text-emerald-600": trend === 'positive',
                    "text-rose-600": trend === 'negative',
                    "text-gray-900": !trend
                })}>
                    {value} <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                    {sub && <div className="text-xs text-gray-400">{sub}</div>}
                    {yoy && (
                        <div className={clsx("text-xs font-medium flex items-center",
                            Number(yoy) > 0 ? (inverseTrend ? "text-rose-500" : "text-emerald-500") :
                                Number(yoy) < 0 ? (inverseTrend ? "text-emerald-500" : "text-rose-500") : "text-slate-400"
                        )}>
                            {Number(yoy) > 0 ? '↑' : '↓'} {Math.abs(Number(yoy))}% <span className="text-slate-400 scale-90 ml-0.5">(同比)</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label, currentYear, prevYear }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
                <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-gray-500 w-20">{entry.name}:</span>
                        <span className="font-bold text-gray-800">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

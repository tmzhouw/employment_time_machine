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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    const availableYears = useMemo(() => {
        if (!companyData?.history.length) return [];
        const years = new Set(companyData.history.map(d => d.report_month.substring(0, 4)));
        return Array.from(years).sort();
    }, [companyData]);

    const searchParams = useSearchParams();
    const companyName = searchParams.get('company');
    const isOpen = !!companyName;
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && companyName) {
            setIsLoadingHistory(true);
            fetchCompanyHistoryAction(companyName)
                .then((response: CompanyHistoryResponse) => {
                    setCompanyData(response);
                    if (response.history.length > 0) {
                        const years = Array.from(new Set(response.history.map((d: CompanyHistoryRecord) => d.report_month.substring(0, 4)))).sort();
                        setSelectedYear(years[years.length - 1]);
                    }
                })
                .finally(() => setIsLoadingHistory(false));
        }
    }, [isOpen, companyName]);

    const currentYearData = useMemo(() => {
        if (!companyData?.history.length) return [];
        return companyData.history.filter(d => d.report_month.startsWith(selectedYear));
    }, [companyData, selectedYear]);

    const prevYearData = useMemo(() => {
        if (!companyData?.history.length || selectedYear === availableYears[0]) return [];
        const prevYear = String(Number(selectedYear) - 1);
        return companyData.history.filter(d => d.report_month.startsWith(prevYear));
    }, [companyData, selectedYear, availableYears]);

    const stats = useMemo(() => {
        const currentRecruited = currentYearData.reduce((sum, d) => sum + (d.recruited_new || 0), 0);
        const currentResigned = currentYearData.reduce((sum, d) => sum + (d.resigned_total || 0), 0);
        const currentNetGrowth = currentRecruited - currentResigned;
        const maxShortage = Math.max(...currentYearData.map(d => d.shortage_total || 0), 0);
        const prevRecruited = prevYearData.reduce((sum, d) => sum + (d.recruited_new || 0), 0);
        const prevResigned = prevYearData.reduce((sum, d) => sum + (d.resigned_total || 0), 0);

        const calcYoY = (curr: number, prev: number) => {
            if (!prev || isNaN(prev) || isNaN(curr)) return null;
            return ((curr - prev) / prev * 100).toFixed(1);
        };

        return {
            netGrowth: isNaN(currentNetGrowth) ? 0 : currentNetGrowth,
            totalRecruited: isNaN(currentRecruited) ? 0 : currentRecruited,
            totalResigned: isNaN(currentResigned) ? 0 : currentResigned,
            maxShortage: isNaN(maxShortage) || maxShortage === -Infinity ? 0 : maxShortage,
            yoyRecruited: calcYoY(currentRecruited, prevRecruited),
            yoyResigned: calcYoY(currentResigned, prevResigned)
        };
    }, [currentYearData, prevYearData]);

    const chartData = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const monthStr = String(i + 1).padStart(2, '0');
            const currentRecord = currentYearData.find(d => d.report_month.substring(5, 7) === monthStr);
            const prevRecord = prevYearData.find(d => d.report_month.substring(5, 7) === monthStr);

            return {
                month: isMobile ? `${i + 1}月` : `${monthStr}月`,
                rawMonth: monthStr,
                employees: currentRecord?.employees_total,
                employees_prev: prevRecord?.employees_total,
                shortage: currentRecord?.shortage_total,
                recruited: currentRecord?.recruited_new,
                resigned: currentRecord?.resigned_total,
                net_growth: (currentRecord?.recruited_new || 0) - (currentRecord?.resigned_total || 0)
            };
        });
    }, [currentYearData, prevYearData, isMobile]);

    const profilingTags = useMemo(() => {
        const tags = [];
        if (stats.netGrowth > 0 && (currentYearData[0]?.employees_total || 0) > 0 && stats.netGrowth / currentYearData[0].employees_total > 0.05) {
            tags.push({ label: '稳健增长', color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp });
        }
        if (stats.totalResigned > stats.totalRecruited * 1.2) {
            tags.push({ label: '流失风险', color: 'bg-rose-100 text-rose-700', icon: AlertCircle });
        }
        const recruited = currentYearData.map(d => d.recruited_new);
        if (recruited.length > 0) {
            const max = Math.max(...recruited);
            const mean = recruited.reduce((a, b) => a + b, 0) / recruited.length;
            if (max > mean * 2.5) {
                tags.push({ label: '季节性强', color: 'bg-amber-100 text-amber-700', icon: Zap });
            }
        }
        return tags;
    }, [stats, currentYearData]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('company');
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    if (!isOpen || !companyName) return null;

    const companyInfo = companyData?.info || initialData?.info || {
        name: companyName,
        industry: '加载中...',
        town: '加载中...',
        contact_person: null,
        contact_phone: null
    };

    const chartMargin = isMobile
        ? { top: 5, right: 20, left: 0, bottom: 0 }
        : { top: 10, right: 10, left: 0, bottom: 0 };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white w-full md:max-w-6xl max-h-[95vh] md:max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 md:p-6 shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg md:text-2xl font-bold truncate">{companyInfo.name}</h2>
                                <div className="flex gap-1.5 flex-wrap">
                                    {profilingTags.map((tag, i) => (
                                        <span key={i} className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] md:text-xs rounded font-medium ${tag.color}`}>
                                            <tag.icon size={10} />
                                            {tag.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 md:gap-6 mt-2 md:mt-3 text-slate-300 text-xs md:text-sm flex-wrap">
                                <div className="flex items-center gap-1"><Building2 size={12} /> {companyInfo.industry}</div>
                                <div className="flex items-center gap-1"><MapPin size={12} /> {companyInfo.town}</div>
                                <div className="flex items-center gap-1"><User size={12} /> {companyInfo.contact_person || '未登记'}</div>
                                <div className="flex items-center gap-1">
                                    <Phone size={12} />
                                    {companyInfo.contact_phone ? (
                                        <a href={`tel:${companyInfo.contact_phone}`} className="hover:text-white hover:underline decoration-white/50 underline-offset-4 transition-all">
                                            {companyInfo.contact_phone}
                                        </a>
                                    ) : '-'}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors ml-2 shrink-0">
                            <X size={isMobile ? 20 : 24} className="text-white/70 hover:text-white" />
                        </button>
                    </div>

                    {/* Year Selector */}
                    <div className="flex mt-4 md:mt-8 gap-1 overflow-x-auto scrollbar-hide border-b border-white/10">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={clsx(
                                    "px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap shrink-0",
                                    selectedYear === year
                                        ? "bg-white text-slate-900"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Calendar size={isMobile ? 12 : 14} />
                                {year}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 bg-slate-50 flex-1">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                        <StatCard
                            label="年度净增长"
                            value={stats.netGrowth > 0 ? `+${stats.netGrowth}` : stats.netGrowth}
                            unit="人"
                            icon={<TrendingUp size={isMobile ? 16 : 20} className={stats.netGrowth >= 0 ? "text-emerald-500" : "text-rose-500"} />}
                            trend={stats.netGrowth >= 0 ? "positive" : "negative"}
                            sub="基于当年累计"
                            compact={isMobile}
                            bgClass={stats.netGrowth >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}
                        />
                        <StatCard
                            label="缺工峰值"
                            value={stats.maxShortage}
                            unit="人"
                            icon={<AlertCircle size={isMobile ? 16 : 20} className="text-orange-500" />}
                            sub="年度最高缺口"
                            compact={isMobile}
                            bgClass="bg-orange-50 border-orange-100"
                            valueClass="text-orange-600"
                        />
                        <StatCard
                            label="累计新招"
                            value={stats.totalRecruited}
                            unit="人"
                            icon={<ArrowUpRight size={isMobile ? 16 : 20} className="text-blue-500" />}
                            yoy={stats.yoyRecruited}
                            compact={isMobile}
                            bgClass="bg-blue-50 border-blue-100"
                        />
                        <StatCard
                            label="累计流失"
                            value={stats.totalResigned}
                            unit="人"
                            icon={<ArrowDownRight size={isMobile ? 16 : 20} className="text-slate-500" />}
                            yoy={stats.yoyResigned}
                            inverseTrend
                            compact={isMobile}
                            bgClass="bg-slate-50 border-slate-100"
                        />
                    </div>

                    {/* Chart 1: Employment Comparison */}
                    <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3 md:mb-6">
                            <h3 className="text-sm md:text-lg font-bold text-gray-800 flex items-center gap-1.5 md:gap-2">
                                <Activity className="text-blue-600" size={isMobile ? 16 : 20} />
                                用工走势 {!isMobile && '(VS 去年)'}
                            </h3>
                            <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500"></span>
                                    <span className="text-gray-600">{selectedYear} 在岗</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-violet-400"></span>
                                    <span className="text-gray-400">{selectedYear ? parseInt(selectedYear) - 1 : ''} 在岗</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-sm bg-red-400"></span>
                                    <span className="text-gray-400">当前缺工</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: isMobile ? 220 : 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={chartMargin}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }} axisLine={false} tickLine={false} interval={isMobile ? 1 : 0} />
                                    <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={isMobile ? 40 : 45} allowDecimals={false} tickFormatter={(v: number) => v >= 10000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: isMobile ? 10 : 12, fill: '#f87171' }} axisLine={false} tickLine={false} width={isMobile ? 20 : 30} />
                                    <Tooltip content={<CustomTooltip currentYear={selectedYear} prevYear={selectedYear ? (parseInt(selectedYear) - 1).toString() : ''} />} />

                                    {/* Previous Year - Solid purple line for clear visibility */}
                                    <Line yAxisId="left" type="monotone" dataKey="employees_prev" stroke="#a78bfa" strokeWidth={1.5} dot={false} name={`${selectedYear ? parseInt(selectedYear) - 1 : ''} 在岗`} />

                                    {/* Current Year - Solid Line */}
                                    <Line yAxisId="left" type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={isMobile ? 2 : 3} dot={isMobile ? false : { r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} activeDot={{ r: 5, fill: '#3b82f6' }} name={`${selectedYear} 在岗`} />

                                    {/* Shortage - Bar Chart on Right Y-Axis */}
                                    <Bar yAxisId="right" dataKey="shortage" fill="#f87171" name="当前缺工" barSize={isMobile ? 4 : 8} radius={[2, 2, 0, 0]} fillOpacity={0.8} />

                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Flux */}
                    <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-3 md:mb-6 flex items-center gap-1.5 md:gap-2">
                            <Users className="text-indigo-600" size={isMobile ? 16 : 20} />
                            人员流动 ({selectedYear})
                        </h3>
                        <div style={{ width: '100%', height: isMobile ? 180 : 256 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} stackOffset="sign">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }} axisLine={false} interval={isMobile ? 1 : 0} />
                                    <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }} axisLine={false} width={isMobile ? 25 : 40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconSize={isMobile ? 8 : 14} wrapperStyle={{ fontSize: isMobile ? 11 : 14 }} />
                                    <Bar dataKey="recruited" name="新招" fill="#10b981" barSize={isMobile ? 10 : 20} radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="resigned" name="流失" fill="#f59e0b" barSize={isMobile ? 10 : 20} radius={[3, 3, 0, 0]} />
                                    <Line type="monotone" dataKey="net_growth" name="净增" stroke="#6366f1" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={handleClose} />
        </div>
    );
}

function StatCard({ label, value, unit, icon, sub, trend, yoy, inverseTrend, compact, bgClass = "bg-white border-gray-100", valueClass }: any) {
    return (
        <div className={clsx("p-3 md:p-4 rounded-xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow", bgClass)}>
            <div className="flex items-center justify-between text-gray-500 mb-1 md:mb-2">
                <span className="text-xs md:text-sm font-medium opacity-80">{label}</span>
                {icon}
            </div>
            <div>
                <div className={clsx("text-xl md:text-2xl font-bold font-mono tracking-tight", valueClass || {
                    "text-emerald-600": trend === 'positive',
                    "text-rose-600": trend === 'negative',
                    "text-gray-900": !trend
                })}>
                    {value} <span className="text-[10px] md:text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
                </div>

                <div className="flex items-center justify-between mt-1 md:mt-2">
                    {sub && <div className="text-[10px] md:text-xs text-gray-400">{sub}</div>}
                    {yoy && (
                        <div className={clsx("text-[10px] md:text-xs font-medium flex items-center",
                            Number(yoy) > 0 ? (inverseTrend ? "text-rose-500" : "text-emerald-500") :
                                Number(yoy) < 0 ? (inverseTrend ? "text-emerald-500" : "text-rose-500") : "text-slate-400"
                        )}>
                            {!isNaN(Number(yoy)) ? (
                                <>
                                    {Number(yoy) > 0 ? '↑' : (Number(yoy) < 0 ? '↓' : '')} {Math.abs(Number(yoy))}%
                                </>
                            ) : '-'}
                            {!compact && <span className="text-slate-400 ml-0.5">(同比)</span>}
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
            <div className="bg-white p-2.5 border border-gray-100 shadow-xl rounded-lg text-xs md:text-sm">
                <p className="font-bold text-gray-900 mb-1.5 border-b border-gray-100 pb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-0.5 last:mb-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-gray-500">{entry.name}:</span>
                        <span className="font-bold text-gray-800">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

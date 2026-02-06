'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { X, Building2, MapPin, User, Phone, TrendingUp, AlertCircle, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area } from "recharts";
import { useEffect, useRef, useState } from "react";

export function EnterpriseDetailModal({ data }: { data: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOpen = !!searchParams.get('company');
    const modalRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Client-side mounting check
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close function: remove query param
    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('company');
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    if (!isOpen || !data) return null;

    const { info, history, stats } = data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div
                ref={modalRef}
                className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex items-start justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold">{info.name}</h2>
                            <span className="px-2 py-1 bg-blue-600 text-xs rounded text-blue-100 font-medium">2025 全年档案</span>
                        </div>
                        <div className="flex items-center gap-6 mt-3 text-slate-300 text-sm">
                            <div className="flex items-center gap-1.5"><Building2 size={14} /> {info.industry}</div>
                            <div className="flex items-center gap-1.5"><MapPin size={14} /> {info.town}</div>
                            <div className="flex items-center gap-1.5"><User size={14} /> {info.contact_person || '未登记'}</div>
                            <div className="flex items-center gap-1.5"><Phone size={14} /> {info.contact_phone || '-'}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} className="text-white/70 hover:text-white" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto p-6 space-y-8 bg-slate-50 flex-1">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="年度净增长"
                            value={stats.netGrowth > 0 ? `+${stats.netGrowth}` : stats.netGrowth}
                            unit="人"
                            icon={<TrendingUp className={stats.netGrowth >= 0 ? "text-emerald-500" : "text-rose-500"} />}
                            trend={stats.netGrowth >= 0 ? "positive" : "negative"}
                        />
                        <StatCard
                            label="缺工峰值"
                            value={stats.maxShortage}
                            unit="人"
                            icon={<AlertCircle className="text-orange-500" />}
                            sub={`平均缺工 ${stats.avgShortage} 人`}
                        />
                        <StatCard
                            label="累计新招"
                            value={stats.totalRecruited}
                            unit="人"
                            icon={<ArrowUpRight className="text-blue-500" />}
                        />
                        <StatCard
                            label="累计流失"
                            value={stats.totalResigned}
                            unit="人"
                            icon={<ArrowDownRight className="text-slate-500" />}
                        />
                    </div>

                    {/* Chart 1: Employment vs Shortage (Dual) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Users className="text-blue-600" size={20} />
                            用工与缺工走势 (Employment vs Shortage)
                        </h3>
                        <div className="h-80 w-full">
                            {!isMounted ? (
                                <div className="p-10 text-center text-gray-400">Loading chart...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="month" tickFormatter={(val) => val.slice(5, 7) + '月'} tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />

                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="shortage"
                                            name="缺工人数"
                                            fill="url(#colorShortage)"
                                            stroke="#f43f5e"
                                            fillOpacity={0.1}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="employees"
                                            name="在岗人数"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                        />
                                        <defs>
                                            <linearGradient id="colorShortage" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Chart 2: Flux (Recruited vs Resigned) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Users className="text-indigo-600" size={20} />
                            人员流动监测 (Recruitment vs Flux)
                        </h3>
                        <div className="h-64 w-full">
                            {!isMounted ? (
                                <div className="p-10 text-center text-gray-400">Loading chart...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={history} stackOffset="sign">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="month" tickFormatter={(val) => val.slice(5, 7) + '月'} tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="recruited" name="新招" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="resigned" name="流失" fill="#f59e0b" barSize={20} radius={[4, 4, 0, 0]} />
                                        <Line type="monotone" dataKey="net_growth" name="净增" stroke="#6366f1" strokeWidth={2} dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            {/* Backdrop Close Layer */}
            <div className="absolute inset-0 -z-10" onClick={handleClose} />
        </div>
    );
}

function StatCard({ label, value, unit, icon, sub, trend }: any) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-sm font-medium">{label}</span>
                {icon}
            </div>
            <div>
                <div className={clsx("text-2xl font-bold", {
                    "text-emerald-600": trend === 'positive',
                    "text-rose-600": trend === 'negative',
                    "text-gray-900": !trend
                })}>
                    {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
                </div>
                {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
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

import clsx from "clsx";

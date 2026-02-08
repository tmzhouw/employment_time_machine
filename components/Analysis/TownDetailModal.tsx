'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, MapPin, TrendingUp, TrendingDown, Users, AlertCircle, Factory } from 'lucide-react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { fetchTownDetailAction } from '@/app/actions';
import { TownDetailResponse } from '@/lib/data';

interface TownDetailModalProps {
    townName: string | null;
    onClose: () => void;
}

export function TownDetailModal({ townName, onClose }: TownDetailModalProps) {
    const [data, setData] = useState<TownDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    useEffect(() => {
        if (townName) {
            setLoading(true);
            fetchTownDetailAction(townName)
                .then(setData)
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [townName]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!townName) return null;

    const chartMargin = isMobile
        ? { top: 5, right: 5, left: -15, bottom: 0 }
        : { top: 10, right: 30, left: 10, bottom: 5 };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                ref={modalRef}
                className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[95vw] md:max-w-[900px] max-h-[92vh] md:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">加载乡镇数据中...</p>
                    </div>
                ) : data ? (
                    <div className="p-4 md:p-8">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4 md:mb-6">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg md:text-2xl font-bold text-slate-900 flex items-center gap-2 md:gap-3">
                                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 shrink-0" />
                                    <span className="truncate">{data.name}</span>
                                </h2>
                                <span className="inline-block mt-1.5 md:mt-2 px-2 md:px-3 py-0.5 md:py-1 bg-emerald-50 text-emerald-700 text-xs md:text-sm font-medium rounded-full">
                                    {data.companyCount}家企业
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 md:p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0 ml-2"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
                            <KpiCard
                                label="月均用工"
                                value={data.avgMonthlyEmployees.toLocaleString()}
                                unit="人"
                                color="text-slate-900"
                            />
                            <KpiCard
                                label="年度增长"
                                value={`${data.yearGrowthRate > 0 ? '+' : ''}${data.yearGrowthRate}%`}
                                color={data.yearGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}
                            />
                            <KpiCard
                                label="全年新招"
                                value={data.totalRecruited.toLocaleString()}
                                unit="人"
                                color="text-blue-600"
                            />
                            <KpiCard
                                label="全年流失"
                                value={data.totalResigned.toLocaleString()}
                                unit="人"
                                color="text-red-600"
                            />
                        </div>

                        {/* Monthly Trend Chart */}
                        <div className="mb-4 md:mb-8">
                            <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2 md:mb-4">
                                月度用工趋势
                            </h3>
                            <div style={{ width: '100%', height: isMobile ? 200 : 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data.monthlyTrend} margin={chartMargin}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="monthLabel"
                                            tick={{ fontSize: isMobile ? 10 : 13, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                            interval={isMobile ? 1 : 0}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={isMobile ? 30 : 50}
                                            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={isMobile ? 25 : 50}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                                padding: isMobile ? '8px 12px' : '12px 16px',
                                                fontSize: isMobile ? 12 : 14,
                                            }}
                                            formatter={(value: any, name: any) => {
                                                const labels: Record<string, string> = {
                                                    employees: '在岗人数',
                                                    resigned: '流失人数',
                                                    recruited: '新招人数',
                                                };
                                                return [Number(value).toLocaleString() + '人', labels[name] || name];
                                            }}
                                        />
                                        <Legend
                                            iconType="circle"
                                            iconSize={isMobile ? 6 : 8}
                                            wrapperStyle={{ paddingTop: '8px', fontSize: isMobile ? 11 : 13 }}
                                            formatter={(value: string) => {
                                                const labels: Record<string, string> = {
                                                    employees: '在岗',
                                                    resigned: '流失',
                                                    recruited: '新招',
                                                };
                                                return <span style={{ color: '#475569' }}>{labels[value] || value}</span>;
                                            }}
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="employees"
                                            fill="#059669"
                                            radius={[4, 4, 0, 0]}
                                            barSize={isMobile ? 14 : 36}
                                            fillOpacity={0.8}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="resigned"
                                            stroke="#f43f5e"
                                            strokeWidth={2}
                                            dot={isMobile ? false : { r: 4, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                                            activeDot={{ r: 5 }}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="recruited"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={isMobile ? false : { r: 4, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top 5 Companies */}
                        <div className="mb-4 md:mb-8">
                            <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2 md:mb-4">
                                重点企业（Top 5）
                            </h3>
                            {isMobile ? (
                                <div className="space-y-2">
                                    {data.topCompanies.map((comp, idx) => (
                                        <div key={comp.name} className="bg-slate-50 rounded-lg p-3">
                                            <button
                                                onClick={() => { onClose(); router.push(`?company=${encodeURIComponent(comp.name)}`); }}
                                                className="text-sm font-medium text-emerald-600 hover:underline text-left truncate block w-full"
                                            >
                                                {idx + 1}. {comp.name}
                                            </button>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                                                <span>月均 <strong className="text-slate-800">{comp.avgEmployees.toLocaleString()}</strong></span>
                                                <span>新招 <strong className="text-emerald-600">{comp.totalRecruited.toLocaleString()}</strong></span>
                                                <span>流失 <strong className="text-red-600">{comp.totalResigned.toLocaleString()}</strong></span>
                                                {comp.currentShortage > 0 && (
                                                    <span>缺 <strong className="text-amber-600">{comp.currentShortage}</strong></span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-emerald-600 text-white">
                                                <th className="text-left py-3 px-4 font-semibold rounded-tl-lg">企业名称</th>
                                                <th className="text-right py-3 px-4 font-semibold">月均用工</th>
                                                <th className="text-right py-3 px-4 font-semibold">全年新招</th>
                                                <th className="text-right py-3 px-4 font-semibold">全年流失</th>
                                                <th className="text-right py-3 px-4 font-semibold rounded-tr-lg">当前急缺</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topCompanies.map((comp, idx) => (
                                                <tr
                                                    key={comp.name}
                                                    className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50/50' : ''} hover:bg-emerald-50/50 transition-colors`}
                                                >
                                                    <td className="py-3 px-4 font-medium text-slate-900">
                                                        <button
                                                            onClick={() => { onClose(); router.push(`?company=${encodeURIComponent(comp.name)}`); }}
                                                            className="hover:text-emerald-600 hover:underline text-left"
                                                        >
                                                            {comp.name}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-700">{comp.avgEmployees.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{comp.totalRecruited.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right text-red-600 font-medium">{comp.totalResigned.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`font-bold ${comp.currentShortage > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                            {comp.currentShortage}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Industry Distribution */}
                        {data.industryDistribution.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-3 md:p-4">
                                <h3 className="text-xs md:text-sm font-bold text-slate-700 mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
                                    <Factory className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                                    主要分布行业
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.industryDistribution.map((t) => (
                                        <span key={t.industry} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-md border border-slate-200">
                                            <span className="font-medium text-slate-800">{t.industry}</span>
                                            <span className="text-slate-400">·</span>
                                            <span className="text-slate-500">{t.avgEmployees.toLocaleString()}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function KpiCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
    return (
        <div className="bg-slate-50 rounded-xl p-3 md:p-4 text-center">
            <p className={`text-xl md:text-2xl font-bold ${color}`}>
                {value}
                {unit && <span className="text-[10px] md:text-xs font-normal text-slate-400 ml-0.5">{unit}</span>}
            </p>
            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">{label}</p>
        </div>
    );
}

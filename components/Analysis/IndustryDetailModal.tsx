'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Factory, TrendingUp, TrendingDown, Users, AlertCircle, MapPin } from 'lucide-react';
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
import { fetchIndustryDetailAction } from '@/app/actions';
import { IndustryDetailResponse } from '@/lib/data';

interface IndustryDetailModalProps {
    industryName: string | null;
    onClose: () => void;
}

export function IndustryDetailModal({ industryName, onClose }: IndustryDetailModalProps) {
    const [data, setData] = useState<IndustryDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (industryName) {
            setLoading(true);
            fetchIndustryDetailAction(industryName)
                .then(setData)
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [industryName]);

    // ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!industryName) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">加载行业数据中...</p>
                    </div>
                ) : data ? (
                    <div className="p-6 md:p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <Factory className="w-6 h-6 text-indigo-500" />
                                    {data.name}产业用工分析
                                </h2>
                                <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">
                                    {data.companyCount}家企业
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <KpiCard
                                label="月均用工（人）"
                                value={data.avgMonthlyEmployees.toLocaleString()}
                                color="text-slate-900"
                            />
                            <KpiCard
                                label="年度增长率"
                                value={`${data.yearGrowthRate > 0 ? '+' : ''}${data.yearGrowthRate}%`}
                                color={data.yearGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}
                            />
                            <KpiCard
                                label="全年新招（人）"
                                value={data.totalRecruited.toLocaleString()}
                                color="text-blue-600"
                            />
                            <KpiCard
                                label="净增长（人）"
                                value={`${data.netGrowth > 0 ? '+' : ''}${data.netGrowth.toLocaleString()}`}
                                color={data.netGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}
                            />
                        </div>

                        {/* Monthly Trend Chart */}
                        <div className="mb-8">
                            <h3 className="text-base font-bold text-slate-900 mb-4">
                                {data.name}月度用工趋势
                            </h3>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data.monthlyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="monthLabel" tick={{ fontSize: 13, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                        <YAxis
                                            yAxisId="left"
                                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={50}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={50}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                                padding: '12px 16px',
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
                                            iconSize={8}
                                            wrapperStyle={{ paddingTop: '12px' }}
                                            formatter={(value: string) => {
                                                const labels: Record<string, string> = {
                                                    employees: '在岗人数',
                                                    resigned: '流失人数',
                                                    recruited: '新招人数',
                                                };
                                                return <span style={{ color: '#475569', fontSize: 13 }}>{labels[value] || value}</span>;
                                            }}
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="employees"
                                            fill="#4f46e5"
                                            radius={[6, 6, 0, 0]}
                                            barSize={36}
                                            fillOpacity={0.8}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="resigned"
                                            stroke="#f43f5e"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="recruited"
                                            stroke="#34d399"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: '#fff', stroke: '#34d399', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top 5 Companies */}
                        <div className="mb-8">
                            <h3 className="text-base font-bold text-slate-900 mb-4">
                                {data.name}产业重点企业用工情况（Top 5）
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-indigo-600 text-white">
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
                                                className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50/50' : ''} hover:bg-indigo-50/50 transition-colors`}
                                            >
                                                <td className="py-3 px-4 font-medium text-slate-900">
                                                    <button
                                                        onClick={() => {
                                                            onClose();
                                                            router.push(`?company=${encodeURIComponent(comp.name)}`);
                                                        }}
                                                        className="hover:text-indigo-600 hover:underline text-left"
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
                        </div>

                        {/* Town Distribution */}
                        {data.townDistribution.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    主要分布乡镇：
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {data.townDistribution.map((t, i) => (
                                        <span key={t.town}>
                                            {i > 0 && '、'}
                                            <span className="font-medium text-slate-800">{t.town}</span>
                                            <span className="text-slate-500">（月均{t.avgEmployees.toLocaleString()}人）</span>
                                        </span>
                                    ))}
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
    );
}

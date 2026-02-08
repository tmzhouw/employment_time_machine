'use client';

import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getIndustryStats, IndustryStat } from '@/lib/data';
import { Users, Wrench, Briefcase, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchIndustryStatsAction } from '@/app/actions';
import { IndustryDetailModal } from '@/components/Analysis/IndustryDetailModal';

const COLORS = {
    general: '#3b82f6', // Blue
    tech: '#ec4899',    // Pink/Rose
    mgmt: '#8b5cf6'     // Purple
};

export default function TalentAnalysisPage() {
    const [stats, setStats] = useState<IndustryStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // We use the server action to fetch data
                // Note: we need to ensure fetchIndustryStatsAction is available and returns the new structure
                // Use getIndustryStats via a server component wrapper or just call it if it was a server component page?
                // For simplicity, let's allow this page to be a Client Component calling a Server Action, 
                // OR make this page a Server Component.

                // Making this a Client Component for recharts interaction is easier.
                // But data fetching is better on server.
                // Let's use the provided 'fetchIndustryStatsAction' if it exists, or create a simple fetcher.
                const data = await fetchIndustryStatsAction();
                setStats(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">数据加载中...</div>;

    // Aggregate City-wide Totals
    const totalStructure = stats.reduce((acc, curr) => ({
        general: acc.general + (curr.talentStructure?.general || 0),
        tech: acc.tech + (curr.talentStructure?.tech || 0),
        mgmt: acc.mgmt + (curr.talentStructure?.mgmt || 0),
        shortage: acc.shortage + curr.shortageCount
    }), { general: 0, tech: 0, mgmt: 0, shortage: 0 });

    const pieData = [
        { name: '普工/操作工', value: totalStructure.general, color: COLORS.general },
        { name: '技能人才', value: totalStructure.tech, color: COLORS.tech },
        { name: '管理/销售', value: totalStructure.mgmt, color: COLORS.mgmt },
    ];

    // Prepare Stacked Bar Data (Top 5 Industries by Shortage)
    const barData = stats
        .sort((a, b) => b.shortageCount - a.shortageCount)
        .slice(0, 8)
        .map(s => ({
            name: s.name,
            general: s.talentStructure?.general || 0,
            tech: s.talentStructure?.tech || 0,
            mgmt: s.talentStructure?.mgmt || 0
        }));

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">全市人才需求结构分析</h1>
                <p className="text-xs md:text-base text-slate-500 mt-1">
                    基于企业填报的紧缺工种数据，分析结构性缺工特征。
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <MetricCard
                    title="紧缺总人数"
                    value={totalStructure.shortage}
                    icon={AlertCircle}
                    color="text-red-500"
                    bg="bg-red-50"
                />
                <MetricCard
                    title="普工需求"
                    value={totalStructure.general}
                    sub={`${((totalStructure.general / totalStructure.shortage) * 100).toFixed(1)}%`}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <MetricCard
                    title="技工需求"
                    value={totalStructure.tech}
                    sub={`${((totalStructure.tech / totalStructure.shortage) * 100).toFixed(1)}%`}
                    icon={Wrench}
                    color="text-pink-500"
                    bg="bg-pink-50"
                />
                <MetricCard
                    title="管理/销售"
                    value={totalStructure.mgmt}
                    sub={`${((totalStructure.mgmt / totalStructure.shortage) * 100).toFixed(1)}%`}
                    icon={Briefcase}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Pie Chart */}
                <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2 md:mb-4">岗位类型分布</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => (value || 0).toLocaleString() + ' 人'} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stacked Bar Chart */}
                <div className="lg:col-span-2 bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2 md:mb-4">重点行业需求结构 Top 8</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                                <Legend />
                                <Bar dataKey="general" name="普工" stackId="a" fill={COLORS.general} barSize={20} />
                                <Bar dataKey="tech" name="技工" stackId="a" fill={COLORS.tech} barSize={20} />
                                <Bar dataKey="mgmt" name="管理销售" stackId="a" fill={COLORS.mgmt} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-3 md:p-6 border-b border-slate-100">
                    <h3 className="text-base md:text-lg font-bold text-slate-900">分行业需求明细表</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">行业名称</th>
                                <th className="px-6 py-4">紧缺总数</th>
                                <th className="px-6 py-4">普工需求</th>
                                <th className="px-6 py-4">技工需求</th>
                                <th className="px-6 py-4">管理需求</th>
                                <th className="px-6 py-4">技工占比</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.map((row) => (
                                <tr
                                    key={row.name}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedIndustry(row.name)}
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                        {row.name}
                                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">详情</span>
                                    </td>
                                    <td className="px-6 py-4 font-bold">{row.shortageCount}</td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">{row.talentStructure?.general || 0}</td>
                                    <td className="px-6 py-4 text-pink-600 font-medium">{row.talentStructure?.tech || 0}</td>
                                    <td className="px-6 py-4 text-purple-600">{row.talentStructure?.mgmt || 0}</td>
                                    <td className="px-6 py-4">
                                        {row.shortageCount > 0
                                            ? `${(((row.talentStructure?.tech || 0) / row.shortageCount) * 100).toFixed(1)}%`
                                            : '-'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedIndustry && (
                <IndustryDetailModal
                    industryName={selectedIndustry}
                    onClose={() => setSelectedIndustry(null)}
                />
            )}
        </div>
    );
}

function MetricCard({ title, value, sub, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-3 md:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-xs md:text-sm font-medium mb-0.5 md:mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg md:text-2xl font-bold text-slate-900">{value.toLocaleString()}</span>
                    {sub && <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${bg} ${color}`}>{sub}</span>}
                </div>
            </div>
            <div className={`p-2 md:p-3 rounded-full ${bg}`}>
                <Icon className={`w-4 h-4 md:w-6 md:h-6 ${color}`} />
            </div>
        </div>
    );
}

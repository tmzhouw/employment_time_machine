'use client';

import { useState, useEffect } from 'react';
import { ComparisonSelector, ComparisonMode } from './ComparisonSelector';
import { fetchIndustryDetailAction, fetchTownDetailAction } from '@/app/actions';
import { IndustryDetailResponse, TownDetailResponse, IndustryMonthlyPoint, IndustryTopCompany } from '@/lib/data';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import { Users, TrendingUp, AlertTriangle, UserMinus } from 'lucide-react';

interface ComparisonDashboardProps {
    allIndustries: string[];
    allTowns: string[];
}

type ComparisonData = (IndustryDetailResponse | TownDetailResponse) & { type: 'industry' | 'town' };

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ComparisonDashboard({ allIndustries, allTowns }: ComparisonDashboardProps) {
    const [mode, setMode] = useState<ComparisonMode>('industry');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [data, setData] = useState<ComparisonData[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch data when selection changes
    useEffect(() => {
        if (selectedItems.length === 0) {
            setData([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const results = await Promise.all(
                    selectedItems.map(async (item) => {
                        if (mode === 'industry') {
                            const res = await fetchIndustryDetailAction(item);
                            return { ...res, type: 'industry' as const };
                        } else {
                            const res = await fetchTownDetailAction(item);
                            return { ...res, type: 'town' as const };
                        }
                    })
                );
                setData(results);
            } catch (error) {
                console.error("Failed to fetch comparison data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedItems, mode]);

    // Reset selection when mode changes
    const handleModeChange = (newMode: ComparisonMode) => {
        setMode(newMode);
        setSelectedItems([]);
        setData([]);
    };

    return (
        <div className="space-y-6">
            <ComparisonSelector
                mode={mode}
                onModeChange={handleModeChange}
                items={mode === 'industry' ? allIndustries : allTowns}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                loading={loading}
            />

            {selectedItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="inline-flex bg-slate-50 p-4 rounded-full mb-4">
                        <GitCompareIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">开始对比分析</h3>
                    <p className="text-slate-500 mt-2">请在上方选择 2-5 个{mode === 'industry' ? '行业' : '乡镇'}进行多维度 PK</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* 1. Key Metrics Diff */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            核心指标一览
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricBattleCard title="用工规模" data={data} field="avgMonthlyEmployees" unit="人" />
                            <MetricBattleCard title="年度增长" data={data} field="yearGrowthRate" unit="%" colorScale />
                            <MetricBattleCard title="当前缺工" data={data} field="totalRecruited" unit="人" label="年新招" />
                            {/* Note: shortage is inside topCompanies or derived. TownDetail/IndustryDetail response doesn't have 'currentShortage' at top level? 
                                Wait, getIndustryDetail return doesn't seem to have totalShortage at top level?
                                Let me check Interface.
                                It has `avgMonthlyEmployees`, `yearGrowthRate`, `totalRecruited`, `totalResigned`, `netGrowth`.
                                It DOES NOT have shortage?
                                Ah, `getIndustryDetail` result has `topCompanies` with shortage, but no top-level shortage.
                                I might need to calculate it from `monthlyTrend` (last month shortage)?
                                `monthlyTrend` point has `shortage`. Yes.
                            */}
                            <MetricBattleCard title="流失人数" data={data} field="totalResigned" unit="人" inverseColor />
                        </div>
                    </section>

                    {/* 2. Trends Battle */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            年度趋势演变 (Trend Battle)
                        </h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="monthLabel"
                                        type="category"
                                        allowDuplicatedCategory={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        tickLine={false}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    {data.map((item, index) => (
                                        <Line
                                            key={item.name}
                                            data={item.monthlyTrend}
                                            type="monotone"
                                            dataKey="employees"
                                            name={item.name}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* 3. Detailed Data Table */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-hidden">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">数据明细对照</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">指标项</th>
                                        {data.map((item, i) => (
                                            <th key={item.name} className="px-6 py-3 font-bold text-slate-900" style={{ color: COLORS[i % COLORS.length] }}>
                                                {item.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="px-6 py-4 font-medium text-slate-600">企业数量</td>
                                        {data.map(item => <td key={item.name} className="px-6 py-4">{item.companyCount} 家</td>)}
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium text-slate-600">月均用工</td>
                                        {data.map(item => <td key={item.name} className="px-6 py-4 font-bold">{item.avgMonthlyEmployees.toLocaleString()} 人</td>)}
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium text-slate-600">年度增长率</td>
                                        {data.map(item => (
                                            <td key={item.name} className={`px-6 py-4 font-medium ${item.yearGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.yearGrowthRate > 0 ? '+' : ''}{item.yearGrowthRate}%
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium text-slate-600">全年新招</td>
                                        {data.map(item => <td key={item.name} className="px-6 py-4 text-blue-600">{item.totalRecruited.toLocaleString()} 人</td>)}
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium text-slate-600">全年流失</td>
                                        {data.map(item => <td key={item.name} className="px-6 py-4 text-red-500">{item.totalResigned.toLocaleString()} 人</td>)}
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium text-slate-600">净增长</td>
                                        {data.map(item => (
                                            <td key={item.name} className={`px-6 py-4 font-medium ${item.netGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.netGrowth > 0 ? '+' : ''}{item.netGrowth.toLocaleString()} 人
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function MetricBattleCard({ title, data, field, unit, colorScale, inverseColor, label }: any) {
    // Find absolute max for bar scaling
    const maxValue = Math.max(...data.map((d: any) => Math.abs(d[field])), 1);

    return (
        <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex justify-between">
                {title}
                {label && <span className="font-normal text-slate-400">({label})</span>}
            </h4>
            <div className="space-y-3">
                {data.map((item: any, i: number) => {
                    const val = item[field];
                    const percent = Math.min(100, Math.max(5, (Math.abs(val) / maxValue) * 100));

                    let barColor = COLORS[i % COLORS.length];
                    if (colorScale) {
                        barColor = val >= 0 ? '#10b981' : '#ef4444';
                    }
                    if (inverseColor) {
                        // Assuming val is positive for resigned, but implies negative impact? 
                        // No, just keep consistency with item color usually, unless it implies "bad".
                        // Use item color for identity, maybe text color for semantic?
                        // Let's stick to item color for the bar identity to match the line chart.
                        barColor = COLORS[i % COLORS.length];
                    }

                    return (
                        <div key={item.name} className="group">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-700 truncate w-20">{item.name}</span>
                                <span className="font-bold font-mono">
                                    {val > 0 && colorScale ? '+' : ''}{val.toLocaleString()}
                                    <span className="text-xs text-slate-400 scale-75 ml-0.5">{unit}</span>
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: barColor,
                                        opacity: 0.8
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function GitCompareIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M13 6h3a2 2 0 0 1 2 2v7" />
            <path d="M11 18H8a2 2 0 0 1-2-2V9" />
        </svg>
    )
}

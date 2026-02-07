'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lightbulb, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface SeasonalData {
    month: number;
    avgRecruited: number;
    avgResigned: number;
    avgShortage: number;
}

interface Props {
    data: SeasonalData[];
}

export function SeasonalAnalysis({ data }: Props) {
    // Determine peak months
    const maxRecruited = Math.max(...data.map(d => d.avgRecruited));
    const maxResigned = Math.max(...data.map(d => d.avgResigned));

    const peakRecruitMonth = data.find(d => d.avgRecruited === maxRecruited)?.month;
    const peakResignMonth = data.find(d => d.avgResigned === maxResigned)?.month;

    // Prepare chart data with labels
    const chartData = data.map(d => ({
        ...d,
        label: `${d.month}月`,
        netChange: d.avgRecruited - d.avgResigned
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section (Takes up 2 columns) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">季节性特征分析</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            聚合历史同月数据，发现年度周期性规律
                        </p>
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="avgRecruited" name="平均招聘" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="avgResigned" name="平均流失" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                            {/* Shortage as a subtle background bar or line? Let's just keep Recruited/Resigned focused */}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Panel (Right Column) */}
            <div className="space-y-4">
                {/* Recruitment Insight */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-900">招聘黄金期</h3>
                            <p className="text-green-800 text-sm mt-1">
                                数据显示，每年 <span className="font-bold text-lg">{peakRecruitMonth}月</span> 是招聘最活跃的月份，平均招工达 {maxRecruited} 人。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Resignation Insight */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-900">流失风险期</h3>
                            <p className="text-red-800 text-sm mt-1">
                                每年 <span className="font-bold text-lg">{peakResignMonth}月</span> 人员流失最为严重，需提前做好留人预案。
                            </p>
                        </div>
                    </div>
                </div>

                {/* General Summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900">智能洞察</h3>
                            <p className="text-blue-800 text-sm mt-1">
                                上半年招聘活跃度普遍高于下半年，建议在 Q1 集中投放招聘资源。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

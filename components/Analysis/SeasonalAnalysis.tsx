'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb, ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

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
    // Determine peak months with safety checks
    const validData = data?.filter(d => !isNaN(d.avgRecruited) && !isNaN(d.avgResigned)) || [];

    const maxRecruited = validData.length > 0 ? Math.max(...validData.map(d => d.avgRecruited)) : 0;
    const maxResigned = validData.length > 0 ? Math.max(...validData.map(d => d.avgResigned)) : 0;

    const peakRecruitMonth = validData.find(d => d.avgRecruited === maxRecruited)?.month;
    const peakResignMonth = validData.find(d => d.avgResigned === maxResigned)?.month;

    // Prepare chart data with labels
    const chartData = data.map(d => ({
        ...d,
        label: `${d.month}月`,
        netChange: d.avgRecruited - d.avgResigned
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section (Takes up 2 columns) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            季节性特征分析
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">
                            聚合历史同月数据，发现年度周期性规律
                        </p>
                    </div>
                </div>

                <div className="h-[250px] md:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                stroke="#94a3b8"
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                            />
                            <Bar dataKey="avgRecruited" name="平均招聘" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                            <Bar dataKey="avgResigned" name="平均流失" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Panel (Right Column) */}
            <div className="space-y-4">
                <InsightCard
                    title="招聘黄金期"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                    theme="emerald"
                    highlight={peakRecruitMonth ? `${peakRecruitMonth}月` : undefined}
                    description={`平均招工达 ${maxRecruited.toLocaleString()} 人，是全年招聘最活跃的窗口期。`}
                />

                <InsightCard
                    title="流失风险期"
                    icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
                    theme="rose"
                    highlight={peakResignMonth ? `${peakResignMonth}月` : undefined}
                    description="人员流失最为严重，建议提前1个月启动储备招聘或留人预案。"
                />

                <InsightCard
                    title="智能洞察"
                    icon={<Sparkles className="w-5 h-5 text-indigo-600" />}
                    theme="indigo"
                    description="上半年招聘活跃度普遍高于下半年，建议在 Q1 集中投放招聘资源。"
                />
            </div>
        </div>
    );
}

interface InsightCardProps {
    title: string;
    icon: React.ReactNode;
    theme: 'emerald' | 'rose' | 'indigo';
    highlight?: string;
    description: string;
}

function InsightCard({ title, icon, theme, highlight, description }: InsightCardProps) {
    const themeStyles = {
        emerald: {
            bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
            border: 'border-emerald-100',
            iconBg: 'bg-white shadow-sm text-emerald-600',
            title: 'text-emerald-900',
            text: 'text-emerald-800',
            highlightTag: 'text-emerald-700 bg-emerald-100/50 border-emerald-200',
            decoration: 'bg-emerald-400'
        },
        rose: {
            bg: 'bg-gradient-to-br from-rose-50 to-orange-50',
            border: 'border-rose-100',
            iconBg: 'bg-white shadow-sm text-rose-600',
            title: 'text-rose-900',
            text: 'text-rose-800',
            highlightTag: 'text-rose-700 bg-rose-100/50 border-rose-200',
            decoration: 'bg-rose-400'
        },
        indigo: {
            bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
            border: 'border-indigo-100',
            iconBg: 'bg-white shadow-sm text-indigo-600',
            title: 'text-indigo-900',
            text: 'text-indigo-800',
            highlightTag: 'text-indigo-700 bg-indigo-100/50 border-indigo-200',
            decoration: 'bg-indigo-400'
        }
    };

    const style = themeStyles[theme];

    return (
        <div className={`${style.bg} border ${style.border} rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition-all duration-300`}>
            {/* Decorative background blob */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${style.decoration} opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700`} />

            <div className="flex items-start gap-4 relative z-10">
                <div className={`p-2.5 rounded-xl ${style.iconBg} shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`font-bold ${style.title} flex items-center gap-2 text-base`}>
                        {title}
                        {highlight && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${style.highlightTag}`}>
                                {highlight}
                            </span>
                        )}
                    </h3>
                    <p className={`text-sm ${style.text} mt-1.5 leading-relaxed opacity-90`}>
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

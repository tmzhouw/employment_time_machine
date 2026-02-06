import {
    getTrendData,
    getIndustryDistribution,
    getReportSummary,
    getTopShortageCompanies,
    getTopRecruitingCompanies,
    getRegionalDistribution,
    getTopTurnoverCompanies,
    getTopGrowthCompanies,
    getCompanyHistory
} from '@/lib/data';
import { ChartSection } from '@/components/TimeMachine/ChartSection';
import { BarChartSection } from '@/components/TimeMachine/BarChartSection';
import { DualAxisTrendChart } from '@/components/TimeMachine/DualAxisTrendChart';
import { MetricCard } from '@/components/TimeMachine/MetricCard';
import { NavBar } from '@/components/TimeMachine/NavBar';
import { EnterpriseDetailModal } from '@/components/TimeMachine/EnterpriseDetailModal';
import clsx from 'clsx';
import { TrendingUp, Users, AlertCircle, Award, Briefcase, MapPin, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const filters = {};
    const companyParam = typeof searchParams.company === 'string' ? searchParams.company : null;

    const [trends, industryDist, summary, topShortage, topRecruiting, regionalDist, topTurnover, topGrowth, companyHistory] = await Promise.all([
        getTrendData(filters),
        getIndustryDistribution(filters),
        getReportSummary(filters),
        getTopShortageCompanies(5, filters),
        getTopRecruitingCompanies(5, filters),
        getRegionalDistribution(filters),
        getTopTurnoverCompanies(5, filters),
        getTopGrowthCompanies(5, filters),
        companyParam ? getCompanyHistory(companyParam) : Promise.resolve(null)
    ]);

    if (!summary) return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
            <NavBar />
            <div className="text-xl font-bold text-gray-400 mt-20">Loading data...</div>
        </div>
    );

    // Calculate Growth Rate
    // Growth Rate = Net Growth / Start of Year
    const startOfYear = summary.start_employment || ((summary.avg_employment || 0) - (summary.net_growth || 0));
    const growthRate = startOfYear > 0
        ? ((summary.net_growth / startOfYear) * 100).toFixed(2) + '%'
        : 'N/A';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            <NavBar />

            <main className="max-w-7xl mx-auto p-6 space-y-8">

                {/* 1. Leader Cockpit Metrics */}
                <section>
                    <MainSectionHeader number="一" title="全市用工概览 (2025全年)" />
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm mt-1">数据来源：全市重点企业直报数据 (已校准)</p>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                数据已更新至 12月
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="调查企业数"
                            value={summary.total_enterprises}
                            unit="家"
                            subLabel="覆盖重点工业企业"
                        />
                        <MetricCard
                            title="在岗员工总数"
                            value={summary.avg_employment.toLocaleString()}
                            unit="人"
                            subLabel="12月底实有"
                        />
                        <MetricCard
                            title="企业缺工率"
                            value={summary.shortage_rate}
                            subLabel="当前紧缺程度"
                        />
                        <MetricCard
                            title="员工增长率"
                            value={growthRate}
                            subLabel="较年初"
                            trend={parseFloat(growthRate) > 0 ? 'up' : 'down'}
                            subValue={parseFloat(growthRate) > 0 ? '增长' : '下降'}
                        />

                        <MetricCard
                            title="全年新招人数"
                            value={summary.cumulative_recruited.toLocaleString()}
                            unit="人"
                            className="bg-blue-50/50 border-blue-100"
                        />
                        <MetricCard
                            title="全年流失人数"
                            value={summary.cumulative_resigned.toLocaleString()}
                            unit="人"
                            className="bg-orange-50/50 border-orange-100"
                        />
                        <MetricCard
                            title="全年净增长"
                            value={(summary.net_growth > 0 ? '+' : '') + summary.net_growth.toLocaleString()}
                            unit="人"
                            trend={summary.net_growth > 0 ? 'up' : 'down'}
                            className="bg-emerald-50/50 border-emerald-100"
                        />
                        <MetricCard
                            title="年流动率"
                            value={summary.turnover_rate}
                            subLabel="累计流失 / 现员"
                        />
                    </div>
                </section>

                {/* 2. Supply & Demand Trends */}
                <section>
                    <MainSectionHeader number="二" title="供需趋势研判 (Trend Analysis)" />
                    <div className="flex flex-col gap-6 mt-6">

                        {/* Top: Monthly Trend (Full Width) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp className="text-blue-600" size={20} />
                                    用工人数 vs 缺工人数 剪刀差分析
                                </h2>
                                <p className="text-sm text-gray-400 ml-7">观察“在岗人数”与“缺工人数”的变化趋势，识别结构性缺工风险。</p>
                            </div>
                            <div className="h-80">
                                <DualAxisTrendChart data={trends} />
                            </div>
                        </div>

                        {/* Bottom: Split Distributions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Industry Dist */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-80">
                                <HeaderTitle title="重点行业用工分布 TOP 5" icon={<Briefcase size={18} className="text-blue-600" />} />
                                <div className="mt-4 h-60">
                                    <BarChartSection data={industryDist.slice(0, 5)} color="#3b82f6" />
                                </div>
                            </div>

                            {/* Town Dist */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-80">
                                <HeaderTitle title="重点乡镇用工分布 TOP 5" icon={<MapPin size={18} className="text-indigo-600" />} />
                                <div className="mt-4 h-60">
                                    <BarChartSection data={regionalDist.slice(0, 5)} color="#6366f1" />
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 3. Key Focus Lists */}
                <section>
                    <MainSectionHeader number="三" title="重点关注名单 (Key Focus Lists)" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

                        {/* Red List: Shortage */}

                        {/* List 1 (Left): Shortage (Red) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-rose-600 flex flex-col min-h-96">
                            <HeaderTitle title="重点缺工“红名单”" icon={<AlertCircle size={18} className="text-rose-600" />} />
                            <div className="mt-4 flex-1 flex flex-col gap-3">
                                {topShortage.map((item: any, idx: number) => (
                                    <ListItem
                                        key={idx}
                                        idx={idx}
                                        name={item.name}
                                        sub={item.industry}
                                        value={`-${item.shortage}`}
                                        unit="缺工"
                                        colorClass="text-rose-600"
                                        bgClass="bg-rose-100"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* List 2 (Center): Personnel Flow Warning (Orange) - Merged */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 flex flex-col min-h-96">
                            <HeaderTitle title="人员流动“预警榜”" icon={<AlertTriangle size={18} className="text-orange-500" />} />
                            <div className="mt-4 flex-1 flex flex-col gap-3">
                                {topTurnover.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-orange-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                                                "bg-orange-100 text-orange-600"
                                            )}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <Link
                                                    href={`?company=${encodeURIComponent(item.name)}`}
                                                    scroll={false}
                                                    className="text-sm font-medium text-gray-900 line-clamp-1 w-24 md:w-32 hover:text-orange-600 hover:underline cursor-pointer"
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </Link>
                                                <div className="text-xs text-gray-500">{item.industry}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-sm font-bold text-rose-500">-{item.value} <span className="text-xs font-normal text-gray-400">流失</span></div>
                                            <div className="text-xs font-medium text-emerald-600">+{item.recruited} <span className="text-[10px] font-normal text-gray-400">新招</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* List 3 (Right): Growth Model (Cyan) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-cyan-600 flex flex-col min-h-96">
                            <HeaderTitle title="稳定增长“模范榜”" icon={<TrendingUp size={18} className="text-cyan-600" />} />
                            <div className="mt-4 flex-1 flex flex-col gap-3">
                                {topGrowth.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-cyan-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                                                "bg-cyan-100 text-cyan-600"
                                            )}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <Link
                                                    href={`?company=${encodeURIComponent(item.name)}`}
                                                    scroll={false}
                                                    className="text-sm font-medium text-gray-900 line-clamp-1 w-24 md:w-32 hover:text-cyan-600 hover:underline cursor-pointer"
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </Link>
                                                <div className="text-xs text-gray-500">{item.industry}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-cyan-600">{item.rateLabel}</div>
                                            <div className="text-xs text-cyan-400">净增{item.value}人</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Enterprise Detail Modal */}
                <EnterpriseDetailModal data={companyHistory} />

            </main>
        </div >
    );
}

function MainSectionHeader({ number, title }: { number: string, title: string }) {
    return (
        <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-900 text-white font-bold px-3 py-1 rounded text-lg font-serif">
                {number}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
    );
}

function HeaderTitle({ title, icon, small }: any) {
    return (
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <div className="p-1.5 rounded-lg bg-gray-50">{icon}</div>
            <h2 className={clsx("font-bold text-gray-800", small ? "text-base" : "text-lg")}>{title}</h2>
        </div>
    );
}

function ListItem({ idx, name, sub, value, unit, colorClass, bgClass }: any) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={clsx("w-6 h-6 shrink-0 text-xs font-bold rounded flex items-center justify-center", colorClass, bgClass)}>
                    {idx + 1}
                </div>
                <div className="min-w-0">
                    <Link
                        href={`?company=${encodeURIComponent(name)}`}
                        scroll={false}
                        className="text-sm font-bold text-gray-800 truncate pr-2 hover:text-blue-600 hover:underline cursor-pointer block"
                    >
                        {name}
                    </Link>
                    <div className="text-xs text-gray-400 truncate">{sub}</div>
                </div>
            </div>
            <div className="text-right shrink-0">
                <div className={clsx("font-bold text-sm", colorClass)}>{value}</div>
                <div className={clsx("text-xs opacity-60", colorClass)}>{unit}</div>
            </div>
        </div>
    );
}

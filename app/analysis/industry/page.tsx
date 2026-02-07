import { getIndustryStats } from '@/lib/data';
import { IndustryRadar } from '@/components/Analysis/IndustryRadar';
import { IndustryRanking } from '@/components/Analysis/IndustryRanking';
import { IndustryTrends } from '@/components/Analysis/IndustryTrends';
import { IndustryDetailTable } from '@/components/Analysis/IndustryDetailTable';
import { EnterpriseDetailModal } from '@/components/TimeMachine/EnterpriseDetailModal';
import { Suspense } from 'react';
import { Factory, Users, AlertCircle, TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function IndustryAnalysisPage() {
    const industryStats = await getIndustryStats();

    // Summary metrics
    const totalIndustries = industryStats.length;
    const totalEmployees = industryStats.reduce((acc, curr) => acc + curr.totalEmployees, 0);
    const totalShortage = industryStats.reduce((acc, curr) => acc + curr.shortageCount, 0);

    const highestShortage = [...industryStats].sort((a, b) => b.shortageRate - a.shortageRate)[0];
    const highestTurnover = [...industryStats].sort((a, b) => b.turnoverRate - a.turnoverRate)[0];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Factory className="w-7 h-7 text-indigo-500" />
                    行业洞察
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    全市各行业用工健康度与结构分析
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <SummaryCard
                    title="监测行业数"
                    value={totalIndustries.toString()}
                    icon={Factory}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <SummaryCard
                    title="全行业在岗"
                    value={totalEmployees.toLocaleString()}
                    subValue="人"
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <SummaryCard
                    title="全行业缺工"
                    value={totalShortage.toLocaleString()}
                    subValue="人"
                    icon={AlertCircle}
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <SummaryCard
                    title="缺工率最高"
                    value={highestShortage?.name || '-'}
                    subValue={`${highestShortage?.shortageRate.toFixed(2) || 0}%`}
                    icon={AlertCircle}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <SummaryCard
                    title="流失率最高"
                    value={highestTurnover?.name || '-'}
                    subValue={`${highestTurnover?.turnoverRate.toFixed(2) || 0}%`}
                    icon={TrendingDown}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
            </div>

            {/* Main Visuals: Treemap + Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Suspense fallback={<div className="h-[420px] bg-white rounded-xl animate-pulse" />}>
                        <IndustryTrends data={industryStats} />
                    </Suspense>
                </div>
                <div>
                    <Suspense fallback={<div className="h-[500px] bg-white rounded-xl animate-pulse" />}>
                        <IndustryRanking data={industryStats} />
                    </Suspense>
                </div>
            </div>

            {/* Industry Detail Modal */}
            <section>
                <IndustryDetailTable data={industryStats} />
            </section>

            {/* Enterprise Detail Modal (triggered via URL param) */}
            <EnterpriseDetailModal data={null} />

            {/* Radar Comparison */}
            <section>
                <Suspense fallback={<div className="h-[400px] bg-white rounded-xl animate-pulse" />}>
                    <IndustryRadar data={industryStats} />
                </Suspense>
            </section>
        </div>
    );
}

function SummaryCard({ title, value, subValue, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
            <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-xl font-bold text-slate-900">{value}</h3>
                {subValue && <p className={`text-xs font-medium mt-0.5 ${color}`}>{subValue}</p>}
            </div>
            <div className={`p-2.5 rounded-lg ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
        </div>
    );
}

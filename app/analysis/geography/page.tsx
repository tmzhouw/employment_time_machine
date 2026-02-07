import { getTownStats, TownStat } from '@/lib/data';
import { TownMap } from '@/components/Analysis/TownMap';
import { TownRanking } from '@/components/Analysis/TownRanking';
import { TownDetailTable } from '@/components/Analysis/TownDetailTable';
import { EnterpriseDetailModal } from '@/components/TimeMachine/EnterpriseDetailModal';
import { RegionComparison } from '@/components/Analysis/RegionComparison';
import { Suspense } from 'react';
import { MapPin, Users, AlertCircle, TrendingUp } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function GeographyAnalysisPage() {
    const townStats = await getTownStats();

    // Calculate Summary Metrics
    const totalEmployees = townStats.reduce((acc, curr) => acc + curr.totalEmployees, 0);
    const totalShortage = townStats.reduce((acc, curr) => acc + curr.shortageCount, 0);

    // Sort logic
    const sortByShortage = [...townStats].sort((a, b) => b.shortageCount - a.shortageCount);
    const maxShortageTown = sortByShortage[0];

    const sortByCompanies = [...townStats].sort((a, b) => b.companyCount - a.companyCount);
    const maxGrowthTown = sortByCompanies[0]; // Proxy for density/activity

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <MapPin className="w-7 h-7 text-amber-500" />
                    地域分析
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    全景透视各乡镇用工分布与缺口强度
                </p>
            </div>

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    title="全区域在岗总数"
                    value={totalEmployees.toLocaleString()}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <SummaryCard
                    title="全区域缺工总数"
                    value={totalShortage.toLocaleString()}
                    icon={AlertCircle}
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <SummaryCard
                    title="缺口最大"
                    value={maxShortageTown?.name || '-'}
                    subValue={`${maxShortageTown?.shortageCount || 0}人缺口`}
                    icon={AlertCircle}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <SummaryCard
                    title="企业最密集"
                    value={maxGrowthTown?.name || '-'}
                    subValue={`${maxGrowthTown?.companyCount || 0}家企业`}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
            </div>

            {/* 2. Main Visuals: Map + Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Treemap (Simulated Map) - 2/3 width */}
                <div className="lg:col-span-2 space-y-4">
                    <Suspense fallback={<div className="h-[500px] bg-white rounded-xl animate-pulse" />}>
                        <TownMap data={townStats} />
                    </Suspense>
                </div>

                {/* Right: Ranking - 1/3 width */}
                <div className="space-y-4">
                    <Suspense fallback={<div className="h-[500px] bg-white rounded-xl animate-pulse" />}>
                        <TownRanking data={townStats} />
                    </Suspense>
                </div>
            </div>



            {/* Town Detail Table */}
            <section>
                <TownDetailTable data={townStats} />
            </section>

            {/* Enterprise Detail Modal */}
            <EnterpriseDetailModal data={null} />

            {/* 3. Comparison */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">重点区域深度对比</h2>
                </div>
                <Suspense fallback={<div className="h-[400px] bg-white rounded-xl animate-pulse" />}>
                    <RegionComparison data={townStats} />
                </Suspense>
            </section>
        </div >
    );
}

function SummaryCard({ title, value, subValue, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                {subValue && <p className={`text-xs font-medium mt-1 ${color}`}>{subValue}</p>}
            </div>
            <div className={`p-3 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
    );
}

import { getIndustryStats, getTownStats } from '@/lib/data';
import { ComparisonDashboard } from '@/components/Analysis/ComparisonDashboard';

export const metadata = {
    title: '全景对比分析 | 就业时空机',
    description: '多维度对比不同行业与区域的用工情况',
};

export const dynamic = 'force-dynamic';

export default async function ComparisonPage() {
    // Fetch initial lists for the selector
    const [industryStats, townStats] = await Promise.all([
        getIndustryStats(),
        getTownStats()
    ]);

    const allIndustries = industryStats.map(i => i.name);
    const allTowns = townStats.map(t => t.name);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">全景对比分析</h1>
                <p className="text-xs md:text-base text-slate-500 mt-1">
                    选择不同维度的对象（行业或区域）进行并排 PK，发现差异与机会。
                </p>
            </div>

            <ComparisonDashboard
                allIndustries={allIndustries}
                allTowns={allTowns}
            />
        </div>
    );
}

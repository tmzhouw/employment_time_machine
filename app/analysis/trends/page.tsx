import { getMultiYearTrendData, getYearOverYearComparison } from '@/lib/data';
import { MultiYearTrendChart } from '@/components/Analysis/MultiYearTrendChart';
import { YearComparisonGrid } from '@/components/Analysis/YearComparisonGrid';
import { Suspense } from 'react';
import { TrendingUp } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TrendsAnalysisPage() {
    const [trendData, yearComparison] = await Promise.all([
        getMultiYearTrendData(),
        getYearOverYearComparison()
    ]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <TrendingUp className="w-7 h-7 text-amber-500" />
                        趋势分析
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        时间维度深度分析 · 多年用工趋势对比
                    </p>
                </div>
            </div>

            {/* Multi-Year Trend Chart */}
            <Suspense fallback={<div className="h-96 bg-white rounded-xl animate-pulse" />}>
                <MultiYearTrendChart data={trendData} />
            </Suspense>

            {/* Year-over-Year Comparison */}
            <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
                <YearComparisonGrid data={yearComparison} />
            </Suspense>

            {/* Placeholder for Temporal Insights (Phase 2.1) */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">时间维度洞察</h2>
                <p className="text-sm text-slate-500">季度分析、季节性规律等功能即将上线...</p>
            </div>
        </div>
    );
}

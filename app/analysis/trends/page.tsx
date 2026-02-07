import {
    getMultiYearTrendData,
    getYearOverYearComparison,
    getQuarterlyBreakdown,
    getSeasonalStats
} from '@/lib/data';
import { MultiYearTrendChart } from '@/components/Analysis/MultiYearTrendChart';
import { YearComparisonGrid } from '@/components/Analysis/YearComparisonGrid';
import { QuarterlyPerformanceChart } from '@/components/Analysis/QuarterlyPerformanceChart';
import { SeasonalAnalysis } from '@/components/Analysis/SeasonalAnalysis';
import { Suspense } from 'react';
import { TrendingUp, Clock } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TrendsAnalysisPage() {
    const [trendData, yearComparison, quarterlyData, seasonalData] = await Promise.all([
        getMultiYearTrendData(),
        getYearOverYearComparison(),
        getQuarterlyBreakdown(),
        getSeasonalStats()
    ]);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-amber-500" />
                    趋势分析
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    时间维度深度分析 · 多年用工趋势对比
                </p>
            </div>

            {/* 1. Multi-Year Trend Chart */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">近年数据概览</h2>
                </div>
                <Suspense fallback={<div className="h-96 bg-white rounded-xl animate-pulse" />}>
                    <MultiYearTrendChart data={trendData} />
                </Suspense>
            </section>

            {/* 2. Year-over-Year Comparison */}
            <section>
                <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
                    <YearComparisonGrid data={yearComparison} />
                </Suspense>
            </section>

            {/* 3. Temporal Insights (Phase 2.1) */}
            <section className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-6 h-6 text-blue-600" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">时间维度深度洞察</h2>
                        <p className="text-slate-500 text-sm">解析季度效能与季节性规律</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Quarterly Analysis */}
                    <Suspense fallback={<div className="h-[400px] bg-slate-100 rounded-xl animate-pulse" />}>
                        <QuarterlyPerformanceChart data={quarterlyData} />
                    </Suspense>

                    {/* Seasonal Analysis */}
                    <Suspense fallback={<div className="h-[400px] bg-slate-100 rounded-xl animate-pulse" />}>
                        <SeasonalAnalysis data={seasonalData} />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}


import React from 'react';
import { ReportSummary } from '@/components/TimeMachine/Report/ReportSummary';
import { ReportOverview } from '@/components/TimeMachine/Report/ReportOverview';
import { TrendAnalysis } from '@/components/TimeMachine/Report/TrendAnalysis';
import { IndustryDistribution } from '@/components/TimeMachine/Report/IndustryDistribution';
import { IndustryAnalysis } from '@/components/TimeMachine/Report/IndustryAnalysis'; // Section 4
import { TownAnalysis } from '@/components/TimeMachine/Report/TownAnalysis'; // Section 5
import { TalentAnalysis } from '@/components/TimeMachine/Report/TalentAnalysis';
import { VocationalConclusion } from '@/components/TimeMachine/Report/VocationalConclusion';

import {
    getReportSummary,
    getDetailedIndustryAnalysis,
    getTownDetailedAnalysis,
    getTrendData,
    getIndustryDistribution,
    getTalentAnalysis
} from '@/lib/data';

import {
    getSkillGapAnalysis,
    getUpskillingPotential,
    getTargetEnterprises
} from '@/lib/dean-data';

export const dynamic = 'force-dynamic';

export default async function DeanReportPage() {
    const [
        summaryData,
        industryData,
        townData,
        trendData,
        distData,
        talentData,
        skillGaps,
        upskilling,
        targets
    ] = await Promise.all([
        getReportSummary(),
        getDetailedIndustryAnalysis(),
        getTownDetailedAnalysis(),
        getTrendData(),
        getIndustryDistribution(),
        getTalentAnalysis(),
        getSkillGapAnalysis(),
        getUpskillingPotential(),
        getTargetEnterprises()
    ]);

    if (!summaryData) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                暂无数据生成报告
            </div>
        );
    }

    // Calculate props for VocationalConclusion
    const topShortageIndustry = summaryData.topShortageIndustry || skillGaps[0]?.industry || '未知';

    // Fix: Synchronize with talentData (same source as the pie chart) to ensure the 25.8% matches
    const techTalent = talentData.find(t => t.type === '技工');
    const techShortageRatio = techTalent ? techTalent.percentage : 0;

    const upskillingIndustries = upskilling.slice(0, 3).map(u => u.industry);
    const targetCompanies = targets.slice(0, 3).map(t => t.name);

    return (
        <div className="min-h-screen report-bg py-4 sm:py-8 print:bg-white print:py-0 font-sans text-slate-800">
            <div className="container mx-auto max-w-[210mm] bg-white/95 backdrop-blur-sm p-4 sm:p-8 md:p-12 shadow-lg print:shadow-none print:max-w-none print:p-0 print:bg-white min-h-[297mm]" suppressHydrationWarning>

                {/* Customized Header (No Unit Name) */}
                <div data-pdf-section="cover">
                    <header className="text-center mb-8 sm:mb-12 md:mb-16">
                        <div className="mb-6 sm:mb-8">
                            <h1 className="report-title text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
                                天门市{summaryData.dataYear}年重点产业人才需求与产教融合决策参考
                            </h1>
                            <div className="w-20 sm:w-24 md:w-32 h-1 mx-auto mb-3 sm:mb-4 bg-primary"></div>
                            <p className="text-base sm:text-lg text-gray-600">
                                基于重点工业企业调查数据实时分析
                            </p>
                        </div>
                        <div className="space-y-1 text-sm sm:text-base text-gray-500">
                            {/* Deleted Unit Name */}
                            <p suppressHydrationWarning>报告日期：{summaryData.dataYear}年12月</p>
                        </div>
                    </header>
                </div>

                {/* 摘要 */}
                <ReportSummary
                    totalCompanies={summaryData.total_enterprises}
                    totalEmployees={summaryData.avg_employment}
                    newHires={summaryData.cumulative_recruited}
                    netGrowth={summaryData.net_growth}
                    growthRate={summaryData.growthRate || 0}
                    topIndustriesShare={summaryData.topIndustriesShare || 0}
                    topTownsShare={summaryData.topTownsShare || 0}
                    topTowns={summaryData.topTowns || []}
                />

                {/* 一、总体概况 */}
                <ReportOverview
                    totalCompanies={summaryData.total_enterprises}
                    avgEmployees={summaryData.avg_employment}
                    totalNewHires={summaryData.cumulative_recruited}
                    netGrowth={summaryData.net_growth}
                    growthRate={summaryData.growthRate || 0}
                    shortageRate={summaryData.shortage_rate}
                    dataYear={summaryData.dataYear}
                />

                {/* 二、月度趋势分析 */}
                <TrendAnalysis data={trendData} dataYear={summaryData.dataYear} />

                {/* 三、行业分布分析 */}
                <IndustryDistribution
                    data={distData}
                    totalEmployees={summaryData.avg_employment}
                />

                {/* 四、"一主两新三支撑"产业详细用工分析 (Section 4) */}
                <IndustryAnalysis industries={industryData} />

                {/* 五、区域分布分析 (Section 5) */}
                <TownAnalysis townData={townData} />

                {/* 六、人才需求分析 */}
                <TalentAnalysis data={talentData} />

                {/* 七、职业教育与培训专项建议 (Vocational Conclusion) */}
                <VocationalConclusion
                    dataYear={summaryData.dataYear}
                    topShortageIndustry={topShortageIndustry}
                    techShortageRatio={techShortageRatio}
                    upskillingIndustries={upskillingIndustries}
                    targetCompanies={targetCompanies}
                />

                {/* No Footer Unit Name */}
            </div>
        </div>
    );
}

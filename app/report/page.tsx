
import React from 'react';
import { ReportHeader } from '@/components/TimeMachine/Report/ReportHeader';
import { ReportSummary } from '@/components/TimeMachine/Report/ReportSummary';
import { ReportOverview } from '@/components/TimeMachine/Report/ReportOverview';
import { TrendAnalysis } from '@/components/TimeMachine/Report/TrendAnalysis';
import { IndustryDistribution } from '@/components/TimeMachine/Report/IndustryDistribution';
import { IndustryAnalysis } from '@/components/TimeMachine/Report/IndustryAnalysis'; // Section 4
import { TownAnalysis } from '@/components/TimeMachine/Report/TownAnalysis'; // Section 5
import { TalentAnalysis } from '@/components/TimeMachine/Report/TalentAnalysis';
import { ReportConclusion } from '@/components/TimeMachine/Report/ReportConclusion';

import {
    getReportSummary,
    getDetailedIndustryAnalysis,
    getTownDetailedAnalysis,
    getTrendData,
    getIndustryDistribution,
    getTalentAnalysis
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ReportPage() {
    const [
        summaryData,
        industryData,
        townData,
        trendData,
        distData,
        talentData
    ] = await Promise.all([
        getReportSummary(),
        getDetailedIndustryAnalysis(),
        getTownDetailedAnalysis(),
        getTrendData(),
        getIndustryDistribution(),
        getTalentAnalysis()
    ]);

    if (!summaryData) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                暂无数据生成报告
            </div>
        );
    }

    return (
        <div className="min-h-screen report-bg py-4 sm:py-8 print:bg-white print:py-0 font-sans text-slate-800">
            <div className="container mx-auto max-w-[210mm] bg-white/95 backdrop-blur-sm p-4 sm:p-8 md:p-12 shadow-lg print:shadow-none print:max-w-none print:p-0 print:bg-white min-h-[297mm]">

                {/* 封面/标题 */}
                <ReportHeader dataYear={summaryData.dataYear} />

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

                {/* 七、结论与建议 */}
                <ReportConclusion
                    dataYear={summaryData.dataYear}
                    growthRate={summaryData.growthRate || 0}
                    growthTrend={summaryData.growthTrend}
                    startEmployment={summaryData.start_employment}
                    endEmployment={summaryData.avg_employment}
                    netGrowth={summaryData.net_growth}
                    topIndustriesShare={summaryData.topIndustriesShare || 0}
                    topIndustryName={summaryData.topIndustryName}
                    topIndustrySharePct={summaryData.topIndustrySharePct || 0}
                    topTowns={summaryData.topTowns || []}
                    topTownsShare={summaryData.topTownsShare || 0}
                    shortageRateNum={summaryData.shortageRateNum || 0}
                    turnoverRateNum={summaryData.turnoverRateNum || 0}
                    topShortageIndustry={summaryData.topShortageIndustry}
                    topTurnoverIndustry={summaryData.topTurnoverIndustry}
                    talentGeneralTechPct={summaryData.talentGeneralTechPct || 0}
                    industryGrowthRates={summaryData.industryGrowthRates || []}
                />

                {/* Footer / End of Report */}
                <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400 print:hidden">
                    — 天门市就业局内部资料，请勿外传 —
                </div>
            </div>
        </div>
    );
}

import React from 'react';

interface ReportSummaryProps {
    totalCompanies: number;
    totalEmployees: number;
    newHires: number;
    netGrowth: number;
    growthRate: number;
    topIndustriesShare: number;
    topTownsShare: number;
    topTowns: string[];
}

export function ReportSummary({
    totalCompanies,
    totalEmployees,
    newHires,
    netGrowth,
    growthRate,
    topIndustriesShare,
    topTownsShare,
    topTowns
}: ReportSummaryProps) {
    const townText = topTowns.length >= 2
        ? `${topTowns[0]}和${topTowns[1]}`
        : topTowns[0] || '重点乡镇';

    return (
        <section className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="report-section-title text-xl sm:text-2xl pb-2 mb-4 sm:mb-6">
                摘 要
            </h2>
            <div className="p-4 sm:p-6 rounded leading-relaxed text-sm sm:text-base bg-gray-50 border border-gray-200 text-gray-700">
                <p className="mb-3 sm:mb-4">
                    本报告基于对天门市<span className="data-highlight">{totalCompanies}家</span>重点工业企业的用工情况实时跟踪调查，
                    结合乐业天门等公开招聘平台数据，对全市用工现状、产业特色、人才需求及发展趋势进行了系统分析。
                </p>
                <p className="mb-3 sm:mb-4">
                    调查显示，当前天门市重点工业企业用工总规模达<span className="data-highlight">{totalEmployees.toLocaleString()}人</span>。
                    全年累计新招员工<span className="data-highlight">{newHires.toLocaleString()}人</span>，
                    净增长<span className="data-highlight">{netGrowth.toLocaleString()}人</span>，
                    {growthRate > 0 ? '增幅' : '变化'}达<span className="data-highlight">{Math.abs(growthRate)}%</span>。
                </p>
                <p>
                    按照"一主两新三支撑"产业布局，六大重点产业共吸纳就业超过<span className="data-highlight">{topIndustriesShare}%</span>。
                    {townText}作为主要产业集聚区，合计吸纳就业占比超过<span className="data-highlight">{topTownsShare}%</span>。
                </p>
            </div>
        </section>
    );
}

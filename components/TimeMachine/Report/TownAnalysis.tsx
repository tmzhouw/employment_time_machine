"use client";

import React from 'react';
import { TownComparisonChart } from './ReportCharts';

interface TownData {
    name: string;
    employees: number;
    companies: number;
    percentage: number;
}

export function TownAnalysis({ townData }: { townData: TownData[] }) {
    // Sort data for chart to show top towns properly
    // Sort data: Top 10 named towns + Other at bottom
    // Current townData might have Other in it already.
    const chartData = [...townData].sort((a, b) => {
        if (a.name === '其他乡镇') return 1;
        if (b.name === '其他乡镇') return -1;
        return b.employees - a.employees;
    }).slice(0, 11);

    return (
        <section className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="report-section-title text-xl sm:text-2xl pb-2 mb-4 sm:mb-6">
                五、区域分布分析
            </h2>

            <div className="mb-6">
                <TownComparisonChart
                    data={chartData}
                    title="各乡镇用工规模对比"
                    description="按月均用工人数排名的前10个乡镇"
                />
            </div>

            <div className="mb-4 sm:mb-6 overflow-x-auto">
                <h3 className="report-subsection-title text-base sm:text-lg mb-3 sm:mb-4 text-center">
                    重点乡镇用工详情
                </h3>
                <table className="report-table text-xs sm:text-sm w-full">
                    <thead>
                        <tr>
                            <th>乡镇</th>
                            <th className="text-right">企业数</th>
                            <th className="text-right">月均用工</th>
                            <th className="text-right">占比</th>
                        </tr>
                    </thead>
                    <tbody>
                        {townData.map((item, index) => (
                            <tr key={index}>
                                <td className="font-medium">{item.name}</td>
                                <td className="text-right">{item.companies}</td>
                                <td className="text-right">{item.employees.toLocaleString()}</td>
                                <td className="text-right">{item.percentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
                从区域分布来看，
                <span className="font-semibold text-primary"> {townData[0]?.name} </span>
                以 {townData[0]?.companies} 家企业、月均 {townData[0]?.employees.toLocaleString()} 人的用工规模位居首位，
                占全市用工的 {townData[0]?.percentage}%。
                {townData[1] && (
                    <>
                        <span className="font-semibold text-primary"> {townData[1].name} </span>
                        位居第二，拥有 {townData[1].companies} 家企业，月均用工 {townData[1].employees.toLocaleString()} 人。
                    </>
                )}
            </p>
        </section>
    );
}

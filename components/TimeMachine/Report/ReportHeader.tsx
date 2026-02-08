import React from 'react';

interface ReportHeaderProps {
    dataYear: string;
}

export function ReportHeader({ dataYear }: ReportHeaderProps) {
    return (
        <div data-pdf-section="cover">
            <header className="text-center mb-8 sm:mb-12 md:mb-16">
                <div className="mb-6 sm:mb-8">
                    <h1 className="report-title text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
                        天门市{dataYear}年用工情况分析报告
                    </h1>
                    <div className="w-20 sm:w-24 md:w-32 h-1 mx-auto mb-3 sm:mb-4 bg-primary"></div>
                    <p className="text-base sm:text-lg text-gray-600">
                        基于重点工业企业调查数据实时分析
                    </p>
                </div>
                <div className="space-y-1 text-sm sm:text-base text-gray-500">
                    <p>编制单位：天门市劳动就业管理局</p>
                    <p>报告日期：{new Date().getFullYear()}年{new Date().getMonth() + 1}月</p>
                </div>
            </header>
        </div>
    );
}

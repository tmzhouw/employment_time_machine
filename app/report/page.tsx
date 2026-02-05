// 'use client' removed to allow server-side data fetching

import React from 'react';
import {
    Users, Building2, UserPlus, TrendingUp, AlertCircle, Award
} from 'lucide-react';
import clsx from 'clsx';
import {
    getTrendData,
    getReportSummary,
    getTopShortageCompanies,
    getTopRecruitingCompanies
} from '@/lib/data';
import { ChartSection } from '@/components/TimeMachine/ChartSection';
import { PrintButton } from '@/components/TimeMachine/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ReportPage() {
    const [trends, summary, topShortage, topRecruiting] = await Promise.all([
        getTrendData(),
        getReportSummary(),
        getTopShortageCompanies(10),
        getTopRecruitingCompanies(10)
    ]);

    if (!summary) return <div>Loading report data...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white text-gray-900 font-sans">
            {/* Print Control */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
                <PrintButton />
            </div>

            {/* A4 Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl print:shadow-none min-h-[1123px] print:min-h-0 overflow-hidden">

                {/* Header - Blue Theme */}
                <header className="bg-blue-900 text-white p-12 print:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold mb-4 font-serif tracking-wide text-white">
                            天门市2025年重点企业用工监测报告
                        </h1>
                        <p className="text-blue-200 text-sm flex justify-center items-center gap-4">
                            <span>数据覆盖: {summary.total_enterprises} 家重点企业</span>
                            <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                            <span>编制日期: {new Date().toLocaleDateString('zh-CN')}</span>
                        </p>
                    </div>
                </header>

                <div className="p-12 print:p-8">
                    {/* Executive Summary Cards - Gold Highlight */}
                    <section className="mb-10">
                        <div className="grid grid-cols-4 gap-4">
                            <SummaryCard
                                label="在岗职工总数"
                                value={summary.avg_employment.toLocaleString()}
                                unit="人"
                                icon={<Users className="text-blue-600" size={18} />}
                            />
                            <SummaryCard
                                label="本年累计新招"
                                value={summary.cumulative_recruited.toLocaleString()}
                                unit="人"
                                icon={<UserPlus className="text-blue-600" size={18} />}
                            />
                            <SummaryCard
                                label="当前缺工总数"
                                value={summary.current_total_shortage.toLocaleString()}
                                unit="人"
                                highlight
                                icon={<AlertCircle className="text-amber-600" size={18} />}
                            />
                            <SummaryCard
                                label="综合缺工率"
                                value={summary.shortage_rate}
                                highlight
                                icon={<TrendingUp className="text-amber-600" size={18} />}
                            />
                        </div>

                        {/* Narrative */}
                        <div className="mt-6 bg-blue-50/50 p-5 rounded-none border-l-4 border-blue-600 text-sm leading-7 text-gray-700 text-justify">
                            <p className="indent-8">
                                报告期内，我市重点企业用工总体呈现<strong>稳中有升</strong>态势。
                                全市 {summary.total_enterprises} 家重点监测企业在岗职工总数达 <strong>{summary.avg_employment.toLocaleString()}</strong> 人。
                                今年以来，累计新招工 <strong>{summary.cumulative_recruited.toLocaleString()}</strong> 人，
                                流失 <strong>{summary.cumulative_resigned.toLocaleString()}</strong> 人，
                                实现人才净增 <strong>{summary.net_growth.toLocaleString()}</strong> 人。
                                目前企业用工缺口主要集中在纺织服装与机械制造行业，缺工率为 <strong>{summary.shortage_rate}</strong>，
                                需持续关注重点企业的招工引才工作。
                            </p>
                        </div>
                    </section>

                    {/* Trends Chart */}
                    <section className="mb-10 page-break-inside-avoid">
                        <SectionTitle title="全市用工趋势监测 (Trends Analysis)" />
                        <div className="h-[280px] w-full mt-4">
                            <ChartSection data={trends} />
                        </div>
                    </section>

                    {/* Top Rankings Tables */}
                    <section className="grid grid-cols-2 gap-8 page-break-inside-avoid">

                        {/* Top Shortage */}
                        <div>
                            <SectionTitle title="企业缺工 TOP 10" small />
                            <div className="mt-4 border-t-2 border-amber-500">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="py-2 pl-2">企业名称</th>
                                            <th className="py-2 text-right">缺工数</th>
                                            <th className="py-2 text-right pr-2">占比</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {topShortage.map((c: any, i: number) => (
                                            <tr key={i} className="hover:bg-blue-50/30">
                                                <td className="py-2 pl-2 truncate max-w-[100px]" title={c.name}>{c.name}</td>
                                                <td className="py-2 text-right text-amber-600 font-bold">{c.shortage}</td>
                                                <td className="py-2 text-right pr-2 text-gray-400">{c.rate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Recruitment */}
                        <div>
                            <SectionTitle title="企业新招 TOP 10" small />
                            <div className="mt-4 border-t-2 border-blue-500">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="py-2 pl-2">企业名称</th>
                                            <th className="py-2 text-right">所属行业</th>
                                            <th className="py-2 text-right pr-2">累计新招</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {topRecruiting.map((c: any, i: number) => (
                                            <tr key={i} className="hover:bg-blue-50/30">
                                                <td className="py-2 pl-2 truncate max-w-[100px]" title={c.name}>{c.name}</td>
                                                <td className="py-2 text-right text-gray-500 truncate max-w-[80px]">{c.industry}</td>
                                                <td className="py-2 text-right pr-2 text-blue-600 font-bold">{c.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </section>

                    {/* Footer */}
                    <footer className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                        <span>天门市智慧就业数据中心</span>
                        <span>第 2025-05 期</span>
                    </footer>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ title, small }: { title: string, small?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className={clsx("w-1 bg-blue-600", small ? "h-4" : "h-5")}></div>
            <h3 className={clsx("font-bold text-blue-900", small ? "text-sm" : "text-lg")}>{title}</h3>
        </div>
    );
}

function SummaryCard({ label, value, unit, icon, highlight = false }: any) {
    return (
        <div className={clsx(
            "p-4 border-l-2 flex flex-col justify-between h-24 transition-all",
            highlight ? "bg-amber-50/30 border-amber-400" : "bg-white border-blue-100 shadow-sm"
        )}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className="opacity-80">{icon}</span>
            </div>
            <div className={clsx(
                "text-2xl font-bold font-serif tracking-tight",
                highlight ? "text-amber-600" : "text-blue-900"
            )}>
                {value} <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
            </div>
        </div>
    );
}

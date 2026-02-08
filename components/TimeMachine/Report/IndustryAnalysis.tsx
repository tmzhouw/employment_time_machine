"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Consistent colors with globals.css
const CATEGORY_COLORS: Record<string, string> = {
    "一主": "#1e3a5f",
    "两新": "#2c5282", // chart-2
    "三支撑": "#4299e1", // chart-5
    "其他": "#94a3b8"
};

export interface IndustryDetail {
    category: string;
    name: string;
    companyCount: number;
    avgEmployees: number;
    growthRate: number;
    totalNewHires: number;
    netGrowth: number;
    totalVacancy: number;
    // Array of 12 values
    monthlyEmployees: number[];
    topCompanies: {
        name: string;
        avgEmployees: number;
        newHires: number;
        attrition: number;
        vacancy: number;
    }[];
    topTowns: {
        name: string;
        employees: number;
    }[];
}

export function IndustryAnalysis({ industries }: { industries: IndustryDetail[] }) {
    return (
        <section className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="report-section-title text-xl sm:text-2xl pb-2 mb-4 sm:mb-6">
                四、"一主两新三支撑"产业详细用工分析
            </h2>

            <p className="leading-relaxed mb-6 text-sm sm:text-base text-gray-700">
                本章节基于实时跟踪调查数据，对"一主两新三支撑"六大重点产业的用工情况进行详细分析，
                包括各产业的月度用工趋势、重点企业用工情况、招聘与流失分析等。
            </p>

            {industries.map((industry, idx) => (
                <div key={idx} className="mb-8 p-4 sm:p-6 rounded-lg bg-slate-50 border border-slate-200 break-inside-avoid">
                    <div className="flex items-center mb-4">
                        <div className="w-2 h-8 rounded mr-3" style={{ backgroundColor: CATEGORY_COLORS[industry.category] || CATEGORY_COLORS['其他'] }}></div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-primary">
                                {idx + 1}. {industry.name}产业用工分析
                            </h3>
                            <span className="text-xs sm:text-sm px-2 py-1 rounded text-white" style={{ backgroundColor: CATEGORY_COLORS[industry.category] || CATEGORY_COLORS['其他'] }}>
                                {industry.category} · {industry.companyCount}家企业
                            </span>
                        </div>
                    </div>

                    {/* Core Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <MetricBox label="月均用工（人）" value={industry.avgEmployees.toLocaleString()} color="text-primary" />
                        <MetricBox
                            label="年度增长率"
                            value={`${industry.growthRate >= 0 ? "+" : ""}${industry.growthRate}%`}
                            color={industry.growthRate >= 0 ? "text-emerald-600" : "text-red-600"}
                        />
                        <MetricBox label="全年新招（人）" value={industry.totalNewHires.toLocaleString()} color="text-amber-600" />
                        <MetricBox
                            label="净增长（人）"
                            value={`${industry.netGrowth >= 0 ? "+" : ""}${industry.netGrowth.toLocaleString()}`}
                            color={industry.netGrowth >= 0 ? "text-emerald-600" : "text-red-600"}
                        />
                    </div>

                    {/* Monthly Trend Chart */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-2 text-slate-600">{industry.name}产业月度用工趋势</h4>
                        <div className="h-[160px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={industry.monthlyEmployees.map((emp, i) => ({ month: `${i + 1}月`, employees: emp }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => v.toLocaleString()} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "12px" }}
                                        itemStyle={{ color: "#334155" }}
                                        formatter={(value: any) => [((Number(value) || 0).toLocaleString()) + "人", "员工数"]}
                                    />
                                    <Bar dataKey="employees" fill={CATEGORY_COLORS[industry.category] || CATEGORY_COLORS['其他']} radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Companies Table */}
                    <div className="mb-4 overflow-x-auto">
                        <h4 className="text-sm font-semibold mb-2 text-slate-600">{industry.name}产业重点企业用工情况（Top 5）</h4>
                        <table className="report-table text-xs w-full">
                            <thead>
                                <tr>
                                    <th>企业名称</th>
                                    <th className="text-right">月均用工</th>
                                    <th className="text-right">全年新招</th>
                                    <th className="text-right">全年流失</th>
                                    <th className="text-right">当前急缺</th>
                                </tr>
                            </thead>
                            <tbody>
                                {industry.topCompanies.map((company, cIdx) => (
                                    <tr key={cIdx}>
                                        <td className="font-medium">{company.name}</td>
                                        <td className="text-right">{company.avgEmployees.toLocaleString()}</td>
                                        <td className="text-right">{company.newHires.toLocaleString()}</td>
                                        <td className="text-right">{company.attrition.toLocaleString()}</td>
                                        <td className="text-right font-bold text-red-600">{company.vacancy}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Top Towns */}
                    <div className="text-sm text-gray-700 mt-3">
                        <span className="font-semibold text-primary">主要分布乡镇：</span>
                        {industry.topTowns.map((town, tIdx) => (
                            <span key={tIdx} className="ml-1">
                                {town.name}（{town.employees.toLocaleString()}人）
                                {tIdx < industry.topTowns.length - 1 ? "、" : ""}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}

function MetricBox({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="text-center p-3 rounded bg-white border border-slate-200">
            <p className={`text-lg sm:text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    );
}

import React from 'react';
import Link from 'next/link';
import { Search, Building2, Users, AlertCircle, Filter, PieChart, Info, Download } from 'lucide-react';
import {
    getReportSummary,
    getFilterOptions,
    getEnterpriseList
} from '@/lib/data';
import { NavBar } from '@/components/TimeMachine/NavBar';
import clsx from 'clsx';
import { redirect } from 'next/navigation';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnalysisPage(props: PageProps) {
    const searchParams = await props.searchParams;

    const filters = {
        industry: typeof searchParams.industry === 'string' ? searchParams.industry : undefined,
        town: typeof searchParams.town === 'string' ? searchParams.town : undefined,
        companyName: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    };

    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
    const pageSize = 50;

    // Pre-fetch filter options
    const filterOptions = await getFilterOptions();

    // Load Data
    const [summary, enterpriseList] = await Promise.all([
        getReportSummary(filters),
        getEnterpriseList(page, pageSize, filters)
    ]);

    if (!summary) return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
            <NavBar />
            <div className="text-xl font-bold text-gray-400 mt-20">Searching data...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            <NavBar />

            {/* Advanced Filter Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10 shadow-sm">
                <form className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">

                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            name="q"
                            defaultValue={filters.companyName}
                            placeholder="请输入企业名称搜索..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Selects */}
                    <div className="flex gap-4">
                        <select
                            name="industry"
                            defaultValue={filters.industry || ''}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[150px]"
                        >
                            <option value="">所有行业</option>
                            {filterOptions.industries.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>

                        <select
                            name="town"
                            defaultValue={filters.town || ''}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[150px]"
                        >
                            <option value="">所有乡镇</option>
                            {filterOptions.towns.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm">
                        查询
                    </button>

                    {(filters.industry || filters.town || filters.companyName) && (
                        <Link href="/analysis" className="text-sm text-gray-500 hover:text-gray-900 underline">
                            重置
                        </Link>
                    )}
                </form>
            </div>

            <main className="max-w-7xl mx-auto p-6 space-y-6">

                {/* 1. Filtered Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="bg-blue-200 p-2 rounded-lg text-blue-700"><Building2 size={24} /></div>
                        <div>
                            <div className="text-xs text-blue-600 font-medium">筛选企业数</div>
                            <div className="text-xl font-bold text-blue-900">{enterpriseList.total} <span className="text-xs font-normal opacity-70">家</span></div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="bg-indigo-200 p-2 rounded-lg text-indigo-700"><Users size={24} /></div>
                        <div>
                            <div className="text-xs text-indigo-600 font-medium">当前在岗</div>
                            <div className="text-xl font-bold text-indigo-900">{summary.avg_employment.toLocaleString()} <span className="text-xs font-normal opacity-70">人</span></div>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="bg-red-200 p-2 rounded-lg text-red-700"><AlertCircle size={24} /></div>
                        <div>
                            <div className="text-xs text-red-600 font-medium">当前缺工</div>
                            <div className="text-xl font-bold text-red-900">{summary.current_total_shortage.toLocaleString()} <span className="text-xs font-normal opacity-70">人</span></div>
                        </div>
                    </div>
                </div>

                {/* 2. Enterprise Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Filter size={16} className="text-blue-600" />
                            <span>企业明细列表 ({enterpriseList.total})</span>
                        </h2>
                        {/* Pagination (Simple) */}
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link href={`?${new URLSearchParams({ ...filters, page: (page - 1).toString() } as any).toString()}`} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
                                    上一页
                                </Link>
                            )}
                            <span className="px-3 py-1 text-sm text-gray-500">第 {page} 页</span>
                            {(enterpriseList.total > page * pageSize) && (
                                <Link href={`?${new URLSearchParams({ ...filters, page: (page + 1).toString() } as any).toString()}`} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
                                    下一页
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">企业名称</th>
                                    <th className="px-6 py-3">所属行业</th>
                                    <th className="px-6 py-3">所属乡镇</th>
                                    <th className="px-6 py-3 text-right">在岗人数</th>
                                    <th className="px-6 py-3 text-right">当前缺工</th>
                                    <th className="px-6 py-3 text-right">本月新招</th>
                                    <th className="px-6 py-3 text-center">风险状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {enterpriseList.data.map((row: any) => {
                                    const shortageRate = row.employees > 0 ? (row.shortage / (row.employees + row.shortage)) : 0;
                                    const isRisk = shortageRate > 0.15;
                                    return (
                                        <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.industry}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.town}</td>
                                            <td className="px-6 py-4 text-right font-mono text-indigo-600 font-bold">{row.employees}</td>
                                            <td className="px-6 py-4 text-right font-mono text-red-600 font-bold">{row.shortage > 0 ? row.shortage : '-'}</td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-600">{row.new_recruits > 0 ? `+${row.new_recruits}` : '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                {isRisk ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                                                        <AlertCircle size={12} /> 缺工预警
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-green-600">正常</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {enterpriseList.data.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            <Info className="mx-auto mb-2 opacity-50" size={32} />
                            <p>未找到符合条件的企业数据</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

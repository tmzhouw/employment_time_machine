'use client';

import { useState } from 'react';
import { ArrowUpDown, Eye, Download, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Company {
    name: string;
    industry: string;
    town: string;
    employees: number;
    shortage: number;
    recruited: number;
    resigned: number;
    turnoverRate: number;
    // New cumulative/monthly fields
    monthlyShortage?: number;
    monthlyRecruited?: number;
    monthlyResigned?: number;
    cumulativeRecruited?: number;
    cumulativeResigned?: number;
    peakShortage?: number;
}

interface EnterpriseTableProps {
    companies: Company[];
}

type SortKey = keyof Company;
type SortDirection = 'asc' | 'desc' | null;

export default function EnterpriseTable({ companies }: EnterpriseTableProps) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

    // Sorting logic
    const sortedCompanies = [...companies].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;

        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortDirection === 'asc'
            ? String(aValue).localeCompare(String(bValue), 'zh-CN')
            : String(bValue).localeCompare(String(aValue), 'zh-CN');
    });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Cycle through: asc -> desc -> null
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortKey(null);
                setSortDirection(null);
            }
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const toggleSelectCompany = (name: string) => {
        const newSelected = new Set(selectedCompanies);
        if (newSelected.has(name)) {
            newSelected.delete(name);
        } else {
            newSelected.add(name);
        }
        setSelectedCompanies(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedCompanies.size === companies.length) {
            setSelectedCompanies(new Set());
        } else {
            setSelectedCompanies(new Set(companies.map(c => c.name)));
        }
    };

    const handleViewDetail = (companyName: string) => {
        router.push(`/analysis/enterprise?company=${encodeURIComponent(companyName)}`);
    };

    const handleBatchExport = () => {
        const selected = companies.filter(c => selectedCompanies.has(c.name));

        // 1. Define Headers with user-requested order
        const headers = [
            '企业名称',
            '行业类型',
            '所在乡镇',
            '在岗人数',
            '本月新招',
            '累计新招',
            '本月流失',
            '累计流失',
            '本月缺工',
            '缺工峰值'
        ];

        // 2. Format Data Rows
        const csvRows = selected.map(c => {
            return [
                `"${c.name}"`, // Quote strings to handle commas
                c.industry,
                c.town,
                c.employees,
                c.monthlyRecruited || c.recruited || 0,
                c.cumulativeRecruited || 0,
                c.monthlyResigned || c.resigned || 0,
                c.cumulativeResigned || 0,
                c.monthlyShortage || c.shortage || 0,
                c.peakShortage || 0
            ].join(',');
        });

        // 3. Combine with BOM for Excel Chinese compatibility
        const csvContent = '\ufeff' + [headers.join(','), ...csvRows].join('\n');

        // 4. Create Blob and Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `企业数据导出_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
        <button
            onClick={() => handleSort(column)}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
            {label}
            <ArrowUpDown className={`w-4 h-4 ${sortKey === column ? 'text-blue-600' : 'text-slate-400'
                }`} />
        </button>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Batch Actions */}
            {selectedCompanies.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-blue-900">
                        已选择 <strong>{selectedCompanies.size}</strong> 家企业
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBatchExport}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" />
                            批量导出
                        </button>
                        <button
                            onClick={() => setSelectedCompanies(new Set())}
                            className="px-3 py-1.5 bg-white text-slate-700 text-sm rounded-lg hover:bg-slate-50 border border-slate-300"
                        >
                            取消选择
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 md:px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedCompanies.size === companies.length && companies.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <SortButton column="name" label="企业名称" />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <SortButton column="industry" label="行业" />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <SortButton column="town" label="乡镇" />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <SortButton column="employees" label="在岗人数" />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <SortButton column="shortage" label="缺工人数" />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <SortButton column="turnoverRate" label="流失率" />
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {sortedCompanies.map((company) => {
                            const shortageRate = company.employees > 0
                                ? (company.shortage / company.employees * 100).toFixed(1)
                                : '0.0';

                            return (
                                <tr
                                    key={company.name}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedCompanies.has(company.name)}
                                            onChange={() => toggleSelectCompany(company.name)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <button
                                            onClick={() => handleViewDetail(company.name)}
                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                                        >
                                            {company.name}
                                        </button>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-700">
                                        {company.industry}
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-700">
                                        {company.town}
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-900 font-medium">
                                        {company.employees.toLocaleString()}
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${company.shortage > 50 ? 'text-red-600' :
                                                company.shortage > 20 ? 'text-orange-600' :
                                                    'text-green-600'
                                                }`}>
                                                {company.shortage}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ({shortageRate}%)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <span className={`text-sm font-medium ${company.turnoverRate > 15 ? 'text-red-600' :
                                            company.turnoverRate > 10 ? 'text-orange-600' :
                                                'text-green-600'
                                            }`}>
                                            {company.turnoverRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <button
                                            onClick={() => handleViewDetail(company.name)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                        >
                                            <Eye className="w-4 h-4" />
                                            详情
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                    共 <strong className="text-slate-900">{companies.length}</strong> 家企业
                </div>
                {sortKey && (
                    <div className="text-sm text-slate-600">
                        按 <strong>{sortKey === 'name' ? '企业名称' : sortKey === 'employees' ? '在岗人数' : sortKey}</strong> {sortDirection === 'asc' ? '升序' : '降序'}排列
                    </div>
                )}
            </div>
        </div>
    );
}

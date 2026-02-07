'use client';

import { useState } from 'react';
import { IndustryStat } from '@/lib/data';
import { IndustryDetailModal } from './IndustryDetailModal';

interface IndustryDetailTableProps {
    data: IndustryStat[];
}

export function IndustryDetailTable({ data }: IndustryDetailTableProps) {
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">行业明细表</h3>
                <p className="text-sm text-slate-500 mb-4">点击行业名称查看详细分析</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-600">行业</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-600">企业数</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-600">在岗总数</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-600">企均规模</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-600">缺工</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-600">缺工率</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-600">流失率</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-600">主力乡镇</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((ind, idx) => (
                                <tr key={ind.name} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50/50' : ''} hover:bg-indigo-50/50 transition-colors`}>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => setSelectedIndustry(ind.name)}
                                            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
                                        >
                                            {ind.name}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-right text-slate-700">{ind.companyCount}</td>
                                    <td className="py-3 px-4 text-right font-medium text-slate-900">{ind.totalEmployees.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right text-slate-700">{ind.avgEmployeesPerCompany}</td>
                                    <td className="py-3 px-4 text-right text-red-600 font-medium">{ind.shortageCount.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ind.shortageRate > 5 ? 'bg-red-100 text-red-700' :
                                            ind.shortageRate > 2 ? 'bg-amber-100 text-amber-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {ind.shortageRate.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ind.turnoverRate > 8 ? 'bg-red-100 text-red-700' :
                                            ind.turnoverRate > 4 ? 'bg-amber-100 text-amber-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {ind.turnoverRate.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">{ind.topTown}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Industry Detail Modal */}
            <IndustryDetailModal
                industryName={selectedIndustry}
                onClose={() => setSelectedIndustry(null)}
            />
        </>
    );
}

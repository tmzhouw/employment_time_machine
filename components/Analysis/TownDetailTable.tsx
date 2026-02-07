'use client';

import { useState } from 'react';
import { TownStat } from '@/lib/data';
import { TownDetailModal } from './TownDetailModal';

interface TownDetailTableProps {
    data: TownStat[];
}

export function TownDetailTable({ data }: TownDetailTableProps) {
    const [selectedTown, setSelectedTown] = useState<string | null>(null);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">乡镇明细表</h3>
            <p className="text-sm text-slate-500 mb-4">点击乡镇名称查看详细分析</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">乡镇</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">企业数</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">在岗总数</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">缺工</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">缺工率</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">流失率</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">主导产业</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((town, idx) => (
                            <tr key={town.name} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50/50' : ''} hover:bg-emerald-50/50 transition-colors`}>
                                <td className="py-3 px-4 font-medium text-slate-900">
                                    <button
                                        onClick={() => setSelectedTown(town.name)}
                                        className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors cursor-pointer text-left"
                                    >
                                        {town.name}
                                    </button>
                                </td>
                                <td className="py-3 px-4 text-right text-slate-700">{town.companyCount}</td>
                                <td className="py-3 px-4 text-right font-medium text-slate-900">{town.totalEmployees.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-red-600 font-medium">{town.shortageCount.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${town.shortageRate > 5 ? 'bg-red-100 text-red-700' :
                                        town.shortageRate > 2 ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {town.shortageRate.toFixed(2)}%
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${town.turnoverRate > 8 ? 'bg-red-100 text-red-700' :
                                        town.turnoverRate > 4 ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {town.turnoverRate.toFixed(2)}%
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-slate-600">{town.topIndustry}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TownDetailModal
                townName={selectedTown}
                onClose={() => setSelectedTown(null)}
            />
        </div>
    );
}

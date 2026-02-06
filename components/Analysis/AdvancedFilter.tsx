'use client';

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface AdvancedFilters {
    industry: string;
    town: string;
    scale: string;
    shortage: string;
    search: string;
}

interface AdvancedFilterProps {
    onFilterChange: (filters: AdvancedFilters) => void;
}

const industries = ['全部', '电子制造', '纺织服装', '机械制造', '化工', '食品加工', '其他'];
const towns = ['全部', '天门工业园', '多宝镇', '竟陵街道', '岳口镇', '渔薪镇', '拖市镇', '张港镇', '其他'];
const scales = ['全部', '< 100人', '100-500人', '> 500人'];
const shortages = ['全部', '轻度 (<5%)', '中度 (5-15%)', '严重 (>15%)'];

export default function AdvancedFilter({ onFilterChange }: AdvancedFilterProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [filters, setFilters] = useState<AdvancedFilters>({
        industry: '全部',
        town: '全部',
        scale: '全部',
        shortage: '全部',
        search: ''
    });

    const updateFilter = (key: keyof AdvancedFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters: AdvancedFilters = {
            industry: '全部',
            town: '全部',
            scale: '全部',
            shortage: '全部',
            search: ''
        };
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    const hasActiveFilters = Object.entries(filters).some(
        ([key, value]) => key !== 'search' && value !== '全部'
    ) || filters.search.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">高级筛选</h3>
                    {hasActiveFilters && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            已筛选
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            清空
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-slate-100 rounded"
                    >
                        <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`} />
                    </button>
                </div>
            </div>

            {/* Filter Options */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            企业搜索
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="输入企业名称..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                行业类型
                            </label>
                            <select
                                value={filters.industry}
                                onChange={(e) => updateFilter('industry', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {industries.map((industry) => (
                                    <option key={industry} value={industry}>
                                        {industry}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Town */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                所在乡镇
                            </label>
                            <select
                                value={filters.town}
                                onChange={(e) => updateFilter('town', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {towns.map((town) => (
                                    <option key={town} value={town}>
                                        {town}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Scale */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                企业规模
                            </label>
                            <select
                                value={filters.scale}
                                onChange={(e) => updateFilter('scale', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {scales.map((scale) => (
                                    <option key={scale} value={scale}>
                                        {scale}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Shortage */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                缺工程度
                            </label>
                            <select
                                value={filters.shortage}
                                onChange={(e) => updateFilter('shortage', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {shortages.map((shortage) => (
                                    <option key={shortage} value={shortage}>
                                        {shortage}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
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
    industryOptions: string[];
    townOptions: string[];
}

const scales = ['全部', '< 100人', '100-500人', '> 500人'];
const shortages = ['全部', '轻度 (<5%)', '中度 (5-15%)', '严重 (>15%)'];

export default function AdvancedFilter({ onFilterChange, industryOptions, townOptions }: AdvancedFilterProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [filters, setFilters] = useState<AdvancedFilters>({
        industry: '全部',
        town: '全部',
        scale: '全部',
        shortage: '全部',
        search: ''
    });

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Auto-collapse on mobile on initial render
            if (mobile) setIsExpanded(false);
        };
        check();
        // Only run check once, don't re-collapse on resize
    }, []);

    const industryList = ['全部', ...industryOptions];
    const townList = ['全部', ...townOptions];

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

    const activeCount = Object.entries(filters).filter(
        ([key, value]) => key !== 'search' && value !== '全部'
    ).length + (filters.search.length > 0 ? 1 : 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 md:p-4"
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                    <h3 className="text-sm md:text-base font-semibold text-slate-900">筛选</h3>
                    {activeCount > 0 && (
                        <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                            {activeCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <span
                            onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-0.5"
                        >
                            <X className="w-3 h-3" />
                            清空
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Active filter tags (shown when collapsed) */}
            {!isExpanded && hasActiveFilters && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {filters.search && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            搜索: {filters.search}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('search', '')} />
                        </span>
                    )}
                    {filters.industry !== '全部' && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {filters.industry}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('industry', '全部')} />
                        </span>
                    )}
                    {filters.town !== '全部' && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {filters.town}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('town', '全部')} />
                        </span>
                    )}
                    {filters.scale !== '全部' && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {filters.scale}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('scale', '全部')} />
                        </span>
                    )}
                    {filters.shortage !== '全部' && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {filters.shortage}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('shortage', '全部')} />
                        </span>
                    )}
                </div>
            )}

            {/* Filter Options */}
            {isExpanded && (
                <div className="px-3 pb-3 md:p-4 space-y-3 md:space-y-4 border-t border-slate-100">
                    {/* Search */}
                    <div className="pt-3 md:pt-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="搜索企业名称..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-slate-50 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Filter Grid — 2 columns on mobile, 4 on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                        <div>
                            <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1">行业</label>
                            <select
                                value={filters.industry}
                                onChange={(e) => updateFilter('industry', e.target.value)}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-slate-50"
                            >
                                {industryList.map((industry) => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1">乡镇</label>
                            <select
                                value={filters.town}
                                onChange={(e) => updateFilter('town', e.target.value)}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-slate-50"
                            >
                                {townList.map((town) => (
                                    <option key={town} value={town}>{town}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1">规模</label>
                            <select
                                value={filters.scale}
                                onChange={(e) => updateFilter('scale', e.target.value)}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-slate-50"
                            >
                                {scales.map((scale) => (
                                    <option key={scale} value={scale}>{scale}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1">缺工</label>
                            <select
                                value={filters.shortage}
                                onChange={(e) => updateFilter('shortage', e.target.value)}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-slate-50"
                            >
                                {shortages.map((shortage) => (
                                    <option key={shortage} value={shortage}>{shortage}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AdvancedFilter from '@/components/Analysis/AdvancedFilter';
import EnterpriseTable from '@/components/Analysis/EnterpriseTable';
import { Building2, Users, AlertCircle, TrendingDown } from 'lucide-react';

interface AdvancedFilters {
    industry: string;
    town: string;
    scale: string;
    shortage: string;
    search: string;
}

interface EnterpriseLibraryClientProps {
    initialCompanies: any[];
    filterOptions: {
        industries: any[];
        towns: any[];
    };
}

export default function EnterpriseLibraryClient({ initialCompanies, filterOptions }: EnterpriseLibraryClientProps) {
    const searchParams = useSearchParams();
    const [filteredCompanies, setFilteredCompanies] = useState(initialCompanies);
    const [filters, setFilters] = useState<AdvancedFilters>({
        industry: '全部',
        town: '全部',
        scale: '全部',
        shortage: '全部',
        search: ''
    });

    const selectedCompany = searchParams?.get('company');

    useEffect(() => {
        let result = [...initialCompanies];

        // Apply filters
        if (filters.industry !== '全部') {
            result = result.filter(c => c.industry === filters.industry);
        }

        if (filters.town !== '全部') {
            if (filters.town === '其他') {
                // "Other" includes explicitly "Other" AND any town not in the main list
                const majorTowns = filterOptions.towns.filter(t => t !== '其他');
                result = result.filter(c => c.town === '其他' || !majorTowns.includes(c.town));
            } else {
                result = result.filter(c => c.town === filters.town);
            }
        }

        if (filters.scale !== '全部') {
            const [min, max] = filters.scale === '< 100人' ? [0, 100] :
                filters.scale === '100-500人' ? [100, 500] :
                    [500, Infinity];
            result = result.filter(c => c.employees >= min && c.employees < max);
        }

        if (filters.shortage !== '全部') {
            result = result.filter(c => {
                const shortageRate = c.employees > 0 ? (c.shortage / c.employees * 100) : 0;
                if (filters.shortage === '轻度 (<5%)') return shortageRate < 5;
                if (filters.shortage === '中度 (5-15%)') return shortageRate >= 5 && shortageRate < 15;
                if (filters.shortage === '严重 (>15%)') return shortageRate >= 15;
                return true;
            });
        }

        if (filters.search) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredCompanies(result);
    }, [filters, initialCompanies]);

    const handleFilterChange = (newFilters: AdvancedFilters) => {
        setFilters(newFilters);
    };

    // Calculate summary stats
    const totalCompanies = filteredCompanies.length;
    const totalEmployees = filteredCompanies.reduce((sum, c) => sum + c.employees, 0);
    const totalShortage = filteredCompanies.reduce((sum, c) => sum + c.shortage, 0);
    const avgTurnover = filteredCompanies.length > 0
        ? (filteredCompanies.reduce((sum, c) => sum + c.turnoverRate, 0) / filteredCompanies.length)
        : 0;

    return (
        <div className="space-y-3 md:space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">企业库</h2>
                <p className="text-sm text-slate-600 mt-1">
                    全面的企业数据查询与分析工具
                </p>
            </div>

            {/* Advanced Filter */}
            <AdvancedFilter
                onFilterChange={handleFilterChange}
                industryOptions={filterOptions.industries}
                townOptions={filterOptions.towns}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-slate-600">企业数量</p>
                            <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                                {totalCompanies}
                            </p>
                            <p className="text-[10px] md:text-xs text-slate-500">家</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-slate-600">总用工</p>
                            <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                                {totalEmployees.toLocaleString()}
                            </p>
                            <p className="text-[10px] md:text-xs text-slate-500">人</p>
                        </div>
                        <div className="p-2 md:p-3 bg-green-50 rounded-lg">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-slate-600">总缺工</p>
                            <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                                {totalShortage.toLocaleString()}
                            </p>
                            <p className="text-[10px] md:text-xs text-slate-500">人</p>
                        </div>
                        <div className="p-2 md:p-3 bg-orange-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-slate-600">流失率</p>
                            <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                                {avgTurnover.toFixed(1)}%
                            </p>
                            <p className="text-[10px] md:text-xs text-slate-500">月均</p>
                        </div>
                        <div className="p-2 md:p-3 bg-red-50 rounded-lg">
                            <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enterprise Table */}
            <EnterpriseTable companies={filteredCompanies} />
        </div>
    );
}

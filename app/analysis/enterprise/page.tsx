'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdvancedFilter from '@/components/Analysis/AdvancedFilter';
import EnterpriseTable from '@/components/Analysis/EnterpriseTable';
import EnterpriseDetailModal from '@/components/TimeMachine/EnterpriseDetailModal';
import { getLatestCompaniesWithTrends } from '@/lib/data';
import { Building2, Users, AlertCircle, TrendingDown } from 'lucide-react';

interface AdvancedFilters {
    industry: string;
    town: string;
    scale: string;
    shortage: string;
    search: string;
}

function EnterpriseLibraryContent() {
    const searchParams = useSearchParams();
    const [companies, setCompanies] = useState<any[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AdvancedFilters>({
        industry: '全部',
        town: '全部',
        scale: '全部',
        shortage: '全部',
        search: ''
    });

    const selectedCompany = searchParams?.get('company');

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getLatestCompaniesWithTrends();
                setCompanies(data);
                setFilteredCompanies(data);
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        let result = [...companies];

        // Apply filters
        if (filters.industry !== '全部') {
            result = result.filter(c => c.industry === filters.industry);
        }

        if (filters.town !== '全部') {
            result = result.filter(c => c.town === filters.town);
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
    }, [filters, companies]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">加载企业数据中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-900">企业库</h2>
                <p className="text-sm text-slate-600 mt-1">
                    全面的企业数据查询与分析工具
                </p>
            </div>

            {/* Advanced Filter */}
            <AdvancedFilter onFilterChange={handleFilterChange} />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">企业数量</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {totalCompanies}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">家</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">总用工人数</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {totalEmployees.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">人</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">总缺工人数</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {totalShortage.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">人</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">平均流失率</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {avgTurnover.toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">月均</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enterprise Table */}
            <EnterpriseTable companies={filteredCompanies} />

            {/* Enterprise Detail Modal */}
            {selectedCompany && (
                <EnterpriseDetailModal companyName={selectedCompany} />
            )}
        </div>
    );
}

export default function EnterpriseLibraryPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">加载中...</p>
                </div>
            </div>
        }>
            <EnterpriseLibraryContent />
        </Suspense>
    );
}

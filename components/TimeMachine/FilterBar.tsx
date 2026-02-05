'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';

interface FilterBarProps {
    options: {
        industries: string[];
        towns: string[];
    };
}

export function FilterBar({ options }: FilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentIndustry = searchParams.get('industry') || '全部';
    const currentTown = searchParams.get('town') || '全部';

    const handleFilterChange = (key: 'industry' | 'town', value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value === '全部') {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-[72px] z-10 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Filter size={16} />
                <span>全局筛选:</span>
            </div>

            {/* Industry Filter */}
            <select
                value={currentIndustry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[150px]"
            >
                <option value="全部">所有行业</option>
                {options.industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                ))}
            </select>

            {/* Town Filter */}
            <select
                value={currentTown}
                onChange={(e) => handleFilterChange('town', e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[150px]"
            >
                <option value="全部">所有乡镇</option>
                {options.towns.map((town) => (
                    <option key={town} value={town}>{town}</option>
                ))}
            </select>

            {(currentIndustry !== '全部' || currentTown !== '全部') && (
                <button
                    onClick={() => router.push('/')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
                >
                    清除筛选
                </button>
            )}
        </div>
    );
}

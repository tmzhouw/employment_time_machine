'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2,
    TrendingUp,
    MapPin,
    Factory,
    GitCompare,
    UserPlus
} from 'lucide-react';
import clsx from 'clsx';

const tabs = [
    {
        name: '企业库',
        href: '/analysis/enterprise',
        icon: Building2,
    },
    {
        name: '趋势',
        href: '/analysis/trends',
        icon: TrendingUp,
    },
    {
        name: '地域',
        href: '/analysis/geography',
        icon: MapPin,
    },
    {
        name: '行业',
        href: '/analysis/industry',
        icon: Factory,
    },
    {
        name: '人才',
        href: '/analysis/talent',
        icon: UserPlus,
    },
    {
        name: '对比',
        href: '/analysis/comparison',
        icon: GitCompare,
    }
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden bg-white border-b border-gray-200 sticky top-[60px] z-10 overflow-x-auto no-scrollbar">
            <div className="flex px-4 py-2 gap-2 min-w-max">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href || pathname?.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                isActive
                                    ? "bg-blue-100 text-blue-700 font-bold border border-blue-200"
                                    : "text-gray-600 hover:bg-gray-100 border border-transparent"
                            )}
                        >
                            <Icon size={16} className={isActive ? "text-blue-600" : "text-gray-400"} />
                            {tab.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

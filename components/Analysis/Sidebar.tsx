import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2,
    TrendingUp,
    MapPin,
    Factory,
    GitCompare
} from 'lucide-react';

const tabs = [
    {
        name: '企业库',
        href: '/analysis/enterprise',
        icon: Building2,
        description: '企业列表与筛选'
    },
    {
        name: '趋势',
        href: '/analysis/trends',
        icon: TrendingUp,
        description: '时间维度分析'
    },
    {
        name: '地域',
        href: '/analysis/geography',
        icon: MapPin,
        description: '区域分布分析'
    },
    {
        name: '行业',
        href: '/analysis/industry',
        icon: Factory,
        description: '行业洞察分析'
    },
    {
        name: '对比',
        href: '/analysis/comparison',
        icon: GitCompare,
        description: '横向对比工具'
    }
];

export default function AnalysisSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-56 bg-slate-900 text-white flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold">全景分析</h2>
                <p className="text-xs text-slate-400 mt-1">多维度数据分析</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href || pathname?.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`
                flex items-start gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 group
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
              `}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-12 bg-blue-400 rounded-r-full" />
                            )}

                            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                                }`} />

                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-200'
                                    }`}>
                                    {tab.name}
                                </div>
                                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'
                                    }`}>
                                    {tab.description}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
                <div className="text-xs text-slate-500">
                    数据更新时间<br />
                    <span className="text-slate-400">2025年1月</span>
                </div>
            </div>
        </div>
    );
}

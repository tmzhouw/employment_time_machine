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
        name: '人才',
        href: '/analysis/talent',
        icon: UserPlus,
        description: '岗位需求分析'
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
        <div className="w-56 bg-blue-900 text-white flex flex-col h-full border-r border-blue-800 shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-blue-800 bg-blue-950/30">
                <h2 className="text-lg font-bold text-white tracking-tight">全景分析</h2>
                <p className="text-xs text-blue-200 mt-1 font-medium">多维度数据分析</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href || pathname?.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`
                flex items-start gap-3 px-4 py-3 rounded-xl relative overflow-hidden
                transition-all duration-200 group
                ${isActive
                                    ? 'bg-blue-800/80 text-white shadow-md border border-blue-700/50'
                                    : 'text-blue-100/70 hover:bg-blue-800/40 hover:text-white hover:shadow-sm'
                                }
              `}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                            )}

                            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-amber-400' : 'text-blue-300/70 group-hover:text-amber-200'
                                }`} />

                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-blue-100'
                                    }`}>
                                    {tab.name}
                                </div>
                                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-blue-300/60 group-hover:text-blue-200'
                                    }`}>
                                    {tab.description}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-blue-800 bg-blue-950/30">
                <div className="text-xs text-blue-300/60">
                    数据系统状态<br />
                    <span className="text-emerald-400 font-medium flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        运行正常
                    </span>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart2, Home } from 'lucide-react';
import clsx from 'clsx';

export function NavBar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-20 border-b-4 border-amber-500">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-serif font-bold text-blue-900 text-xl shadow-inner">T</div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none">天门市企业用工时序监测大脑</h1>
                            <p className="text-xs text-blue-200 mt-1">Tianmen Enterprise Employment Time-Machine</p>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className={clsx(
                            "flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all border",
                            isActive('/')
                                ? "bg-white/20 border-white/40 text-white font-bold"
                                : "bg-transparent border-transparent text-blue-200 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <Home size={16} />
                        <span>总体概况</span>
                    </Link>

                    <Link
                        href="/analysis"
                        className={clsx(
                            "flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all border",
                            isActive('/analysis')
                                ? "bg-white/20 border-white/40 text-white font-bold"
                                : "bg-transparent border-transparent text-blue-200 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <BarChart2 size={16} />
                        <span>全景分析</span>
                    </Link>

                    <div className="h-6 w-px bg-white/20 mx-2"></div>

                    <Link href="/report" className="flex items-center gap-2 text-sm bg-amber-500 hover:bg-amber-400 text-blue-900 font-bold border border-amber-400 px-4 py-2 rounded-full transition-all shadow-lg hover:shadow-amber-500/20 group">
                        <FileText size={16} />
                        <span>生成分析报告</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart2, Home, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import React from 'react';

export function NavBar() {
    const pathname = usePathname();

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50 border-b-4 border-amber-500">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-serif font-bold text-blue-900 text-lg md:text-xl shadow-inner flex-shrink-0">T</div>
                        <div>
                            <h1 className="text-sm md:text-xl font-bold tracking-tight text-white leading-none line-clamp-1">天门市企业用工时序监测平台</h1>
                            <p className="text-[10px] md:hidden text-blue-200 mt-0.5">Employment Time-Machine</p>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
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

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-blue-950 border-t border-blue-800 absolute w-full left-0 animate-in slide-in-from-top-2 fade-in-20">
                    <div className="p-4 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive('/') ? "bg-white/10 text-white font-bold" : "text-blue-200 hover:bg-white/5"
                            )}
                        >
                            <Home size={18} />
                            <span>总体概况</span>
                        </Link>
                        <Link
                            href="/analysis"
                            onClick={() => setIsMenuOpen(false)}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive('/analysis') ? "bg-white/10 text-white font-bold" : "text-blue-200 hover:bg-white/5"
                            )}
                        >
                            <BarChart2 size={18} />
                            <span>全景分析</span>
                        </Link>
                        <Link
                            href="/report"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-amber-500 font-bold hover:bg-white/5 mt-2 border-t border-blue-800/50 pt-4"
                        >
                            <FileText size={18} />
                            <span>生成分析报告</span>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

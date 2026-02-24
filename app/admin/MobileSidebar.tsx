'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Users, Building2, ShieldCheck, Menu, X, LogOut } from 'lucide-react';

const navItems = [
    { href: '/admin', label: '填报管理', icon: ClipboardList, exact: true },
    { href: '/admin/enterprises', label: '企业管理', icon: Building2 },
    { href: '/admin/accounts', label: '账号管理', icon: Users },
    { href: '/admin/system', label: '系统管理', icon: ShieldCheck },
];

export default function MobileSidebar({ username, role }: { username: string; role: string }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B1120] text-white sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-sm">政府管理后台</span>
                </div>
                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {open && (
                <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setOpen(false)}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50" />
                    {/* Drawer */}
                    <div
                        className="relative w-64 bg-[#0B1120] text-slate-300 flex flex-col h-full shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-[#1E293B]/50">
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-blue-500" />
                                政府管理后台
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">运行监测系统</p>
                        </div>

                        <nav className="p-3 flex-1">
                            <ul className="space-y-1">
                                {navItems.map(item => {
                                    const isActive = item.exact
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href);
                                    const Icon = item.icon;

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors relative ${isActive
                                                    ? 'bg-blue-900/40 text-blue-400'
                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-400 rounded-r-full" />
                                                )}
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className="p-4 border-t border-[#1E293B]/50">
                            <div className="flex items-center gap-3 px-3 py-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-sm font-bold text-slate-300">
                                    {username.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{username}</p>
                                    <p className="text-xs text-slate-500 truncate">{role === 'SUPER_ADMIN' ? '超级管理员' : '乡镇管理员'}</p>
                                </div>
                            </div>
                            <form action="/api/logout" method="POST">
                                <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors">
                                    <LogOut className="w-5 h-5" />
                                    退出登录
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

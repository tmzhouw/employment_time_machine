'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building2, ShieldCheck } from 'lucide-react';

const navItems = [
    { href: '/admin', label: '填报管理', icon: LayoutDashboard, exact: true },
    { href: '/admin/enterprises', label: '企业管理', icon: Building2 },
    { href: '/admin/accounts', label: '账号管理', icon: Users },
    { href: '/admin/system', label: '系统管理', icon: ShieldCheck },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="p-4 flex-1">
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
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors relative ${isActive
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                                )}
                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

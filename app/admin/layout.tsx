import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row">
            {/* Sidebar for Desktop */}
            <aside className="w-full sm:w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-blue-500" />
                        政府管理后台
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">运行监测系统</p>
                </div>

                <nav className="p-4 flex-1">
                    <ul className="space-y-1">
                        <li>
                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-colors">
                                <LayoutDashboard className="w-5 h-5" />
                                填报进度监控
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/accounts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-colors">
                                <Users className="w-5 h-5" />
                                企业账号管理
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                            {session.user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{session.user.username}</p>
                            <p className="text-xs text-slate-500 truncate">{session.user.role === 'SUPER_ADMIN' ? '超级管理员' : '乡镇管理员'}</p>
                        </div>
                    </div>
                    <form action={async () => {
                        'use server';
                        await logout();
                        redirect('/login');
                    }}>
                        <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <LogOut className="w-5 h-5" />
                            退出登录
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

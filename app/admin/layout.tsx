import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LayoutDashboard, LogOut } from 'lucide-react';
import AdminNav from './AdminNav';
import MobileSidebar from './MobileSidebar';

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
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <MobileSidebar username={session.user.username} role={session.user.role} />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col flex-shrink-0 sticky top-0 h-screen">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-blue-500" />
                        政府管理后台
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">运行监测系统</p>
                </div>

                <AdminNav />

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
            <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
                {children}
            </main>
        </div>
    );
}

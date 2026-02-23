import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'TOWN_ADMIN') {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">企业直报平台</h1>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="hidden sm:inline-block">欢迎, {session.user.username}</span>
                        <a href="/portal/profile" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">设置</a>
                        <form action={async () => {
                            'use server';
                            await logout();
                            redirect('/login');
                        }}>
                            <button type="submit" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">退出</button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 pb-24">
                {children}
            </main>
        </div>
    );
}

import { Suspense } from 'react';
import { getAccountData, createManager, createAdmin } from './actions';
import AccountsClient from './AccountsClient';
import { Users } from 'lucide-react';
import { getSession } from '@/lib/auth';

export const metadata = {
    title: '账号管理 - 政府管理后台',
};

export const dynamic = 'force-dynamic';

async function AccountsOverview() {
    const data = await getAccountData();
    const session = await getSession();
    return <AccountsClient initialData={data} createAction={createManager} createAdminAction={createAdmin} currentUsername={session?.user?.username || ''} />;
}

export default function AccountsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-7 h-7 text-indigo-600" />
                    账号管理
                </h1>
                <p className="text-gray-500 mt-2">
                    集中管理全系统的管理员身份、新建专员账号，并执行全局密码安全重置。此页面仅超级管理员可见。
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <Suspense fallback={
                    <div className="animate-pulse space-y-4">
                        <div className="h-48 bg-gray-100 rounded-xl"></div>
                        <div className="h-64 bg-gray-100 rounded-xl"></div>
                    </div>
                }>
                    <AccountsOverview />
                </Suspense>
            </div>
        </div>
    );
}

import { Suspense } from 'react';
import { getSystemData } from './actions';
import SystemClient from './SystemClient';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
    title: '系统管理 - 政府管理后台',
};

// Force dynamic since audit logs change frequently
export const dynamic = 'force-dynamic';

async function SystemOverview() {
    const data = await getSystemData();
    return <SystemClient initialData={data} />;
}

export default function SystemPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-7 h-7 text-indigo-600" />
                    系统管理 (System Management)
                </h1>
                <p className="text-gray-500 mt-2">
                    全局安全策略与高危指令操作审查。此页面仅超级管理员可见。
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <Suspense fallback={
                    <div className="animate-pulse space-y-4">
                        <div className="h-full bg-gray-100 rounded-xl"></div>
                    </div>
                }>
                    <SystemOverview />
                </Suspense>
            </div>
        </div>
    );
}

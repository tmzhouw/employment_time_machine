import { Suspense } from 'react';
import { getEnterprises, createEnterprise } from './actions';
import EnterprisesClient from './EnterprisesClient';
import { Building2 } from 'lucide-react';

export const metadata = {
    title: '企业管理 - 政府管理后台',
};

// Extracted async data fetcher for Suspense
async function EnterpriseList() {
    const data = await getEnterprises();
    return <EnterprisesClient initialData={data.companies} managers={data.managers} createAction={createEnterprise} />;
}

export default function EnterprisesPage() {
    return (
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-7 h-7 text-indigo-600" />
                    企业底座档案管理
                </h1>
                <p className="text-gray-500 mt-2">
                    管理全市重点企业花名册及底层登录账号。支持新增企业、变更 HR 联系人手机及分配数据管辖权。
                </p>
            </div>

            <Suspense fallback={
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
                    <div className="h-64 bg-gray-100 rounded-xl"></div>
                </div>
            }>
                <EnterpriseList />
            </Suspense>
        </div>
    );
}

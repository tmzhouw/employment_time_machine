import { getAccounts } from './actions';
import AccountsClient from './AccountsClient';
import { Suspense } from 'react';

export default async function AccountsPage() {
    const initialAccounts = await getAccounts();

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-24">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 text-sm">正在拉取企业权限列表...</p>
                </div>
            </div>
        }>
            <AccountsClient initialAccounts={initialAccounts} />
        </Suspense>
    );
}

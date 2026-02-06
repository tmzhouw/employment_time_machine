import { Suspense } from 'react';
import { getLatestCompaniesWithTrends } from '@/lib/data';
import EnterpriseLibraryClient from '@/components/Analysis/EnterpriseLibraryClient';

export default async function EnterpriseLibraryPage() {
    // Fetch data on server
    const companies = await getLatestCompaniesWithTrends();

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">加载中...</p>
                </div>
            </div>
        }>
            <EnterpriseLibraryClient initialCompanies={companies} />
        </Suspense>
    );
}

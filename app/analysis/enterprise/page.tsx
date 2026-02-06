import { Suspense } from 'react';
import { getLatestCompaniesWithTrends, getCompanyHistory } from '@/lib/data';
import EnterpriseLibraryClient from '@/components/Analysis/EnterpriseLibraryClient';
import { EnterpriseDetailModal } from '@/components/TimeMachine/EnterpriseDetailModal';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EnterpriseLibraryPage({ searchParams }: Props) {
    // Fetch data on server
    const companies = await getLatestCompaniesWithTrends();

    const params = await searchParams;
    const selectedCompanyName = params?.company as string;
    let selectedCompanyData = null;

    if (selectedCompanyName) {
        selectedCompanyData = await getCompanyHistory(selectedCompanyName);
    }

    return (
        <div className="relative">
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

            {selectedCompanyData && (
                <EnterpriseDetailModal data={selectedCompanyData} />
            )}
        </div>
    );
}

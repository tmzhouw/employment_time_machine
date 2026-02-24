import { getReportingStatus } from './actions';
import AdminClient from './AdminClient';
import { Suspense } from 'react';
import { ClipboardList } from 'lucide-react';

export const metadata = {
    title: '填报管理 - 政府管理后台',
};

// Force dynamic so we get live progress data
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable cache

async function DashboardOverview({ reportMonth }: { reportMonth: string }) {
    const reports = await getReportingStatus(reportMonth);
    return (
        <AdminClient initialData={reports} reportMonth={reportMonth} />
    );
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const params = await searchParams;

    const d = new Date();
    const currentYear = d.getFullYear();
    const currentMonth = String(d.getMonth() + 1).padStart(2, '0');
    const defaultMonth = `${currentYear}-${currentMonth}-01`;

    // Use month from URL or default to current month
    const reportMonth = params.month || defaultMonth;

    // Extract display values
    const [yearStr, monthStr] = reportMonth.split('-');

    return (
        <div className="p-6 md:p-8 max-w-[1600px] w-full mx-auto flex flex-col min-h-[calc(100vh-4rem)] gap-6">
            <div className="shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-7 h-7 text-blue-500" />
                    {yearStr}年{monthStr}月 填报与波动预警管理
                </h2>
                <p className="text-gray-500 mt-1">实时追踪所辖企业用工直报情况，对数据异动进行人工审核归档</p>
            </div>

            <Suspense fallback={
                <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="h-28 bg-gray-100 rounded-xl"></div>
                        <div className="h-28 bg-gray-100 rounded-xl"></div>
                        <div className="h-28 bg-gray-100 rounded-xl"></div>
                        <div className="h-28 bg-gray-100 rounded-xl"></div>
                    </div>
                    <div className="h-96 bg-gray-100 rounded-xl"></div>
                </div>
            }>
                <DashboardOverview reportMonth={reportMonth} />
            </Suspense>
        </div>
    );
}

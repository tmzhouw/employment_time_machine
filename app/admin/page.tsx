import { getReportingStatus } from './actions';
import AdminClient from './AdminClient';
import { Suspense } from 'react';

export const metadata = {
    title: '填报管理 - 政府管理后台',
};

// Force dynamic so we get live progress data
export const dynamic = 'force-dynamic';

async function DashboardOverview() {
    const d = new Date();
    const currentYear = d.getFullYear();
    const currentMonth = String(d.getMonth() + 1).padStart(2, '0');
    // For local dev alignment with the form:
    const reportMonth = `${currentYear}-${currentMonth}-01`;

    const reports = await getReportingStatus(reportMonth);

    return (
        <AdminClient initialData={reports} reportMonth={reportMonth} />
    );
}

export default function AdminDashboardPage() {
    const d = new Date();
    const currentYear = d.getFullYear();
    const currentMonth = String(d.getMonth() + 1).padStart(2, '0');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentYear}年{currentMonth}月 填报与波动预警管理</h2>
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
                <DashboardOverview />
            </Suspense>
        </div>
    );
}

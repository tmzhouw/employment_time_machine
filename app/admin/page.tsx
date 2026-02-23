import { getReportingStatus } from './actions';
import { CheckCircle2, Clock, Building2, Search } from 'lucide-react';

export default async function AdminDashboardPage() {
    // Current month format: YYYY-MM-01 based on actual date
    const d = new Date();
    // Defaulting to 1st of current logic (in reality, if you want last month's report, you might subtract 1 month)
    // Here we use the system's current logic from PortalForm, which assumes "2026-02-01".
    const currentYear = d.getFullYear();
    const currentMonth = String(d.getMonth() + 1).padStart(2, '0');
    const reportMonth = `${currentYear}-${currentMonth}-01`;

    const reports = await getReportingStatus(reportMonth);

    const totalCompanies = reports.length;
    const submittedCompanies = reports.filter(r => r.status === 'APPROVED' || r.status === 'SUBMITTED').length;
    const pendingCompanies = totalCompanies - submittedCompanies;
    const completionRate = totalCompanies > 0 ? ((submittedCompanies / totalCompanies) * 100).toFixed(1) : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentYear}年{currentMonth}月 填报进度监控</h2>
                <p className="text-gray-500 mt-1">实时追踪全市重点企业用工数据直报情况</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6">
                    <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> 监测企业总数
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{totalCompanies}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6">
                    <div className="text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> 已填报企业
                    </div>
                    <div className="text-3xl font-bold text-green-600">{submittedCompanies}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6">
                    <div className="text-sm font-medium text-orange-500 mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 未填报企业
                    </div>
                    <div className="text-3xl font-bold text-orange-500">{pendingCompanies}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-5 pl-6 text-white">
                    <div className="text-sm font-medium text-blue-100 mb-1">
                        全市整体填报率
                    </div>
                    <div className="text-3xl font-bold">{completionRate}%</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800">企业催报名册</h3>
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="搜索企业或乡镇..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            disabled
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500 w-1/3">企业名称</th>
                                <th className="px-6 py-3 font-medium text-gray-500">所属乡镇</th>
                                <th className="px-6 py-3 font-medium text-gray-500">填报状态</th>
                                <th className="px-6 py-3 font-medium text-gray-500">最后更新时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((r, i) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{r.town || '未知'}</td>
                                    <td className="px-6 py-4">
                                        {r.status === 'APPROVED' || r.status === 'SUBMITTED' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 已填报
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div> 待填报
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString('zh-CN') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


import { getReportSummary, getIndustryDistribution } from '@/lib/data';
import { BarChartSection } from '@/components/TimeMachine/BarChartSection';
import { NavBar } from '@/components/TimeMachine/NavBar';
import { Card } from '@/components/ui/card'; // Check if this exists or use manual styling
import { Clock, Database, BarChart3, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TestDeploymentPage() {
    const startTime = Date.now();
    const summary = await getReportSummary();
    const dbStatus = summary ? 'Connected' : 'Failed';
    const industryData = await getIndustryDistribution();
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Use current time to show when the page was hit
    const hitTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    return (
        <div className="min-h-screen bg-slate-50">
            <NavBar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">部署诊断测试页面</h1>
                        <p className="text-slate-500 text-sm">这是一个隐藏页面，用于验证构建和数据状态</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Diagnostic Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" />
                            服务器状态
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">当前服务器时间:</span>
                                <span className="font-mono font-medium">{hitTime}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">API 延迟:</span>
                                <span className="font-mono font-medium text-emerald-600">{latency}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">构建标识:</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600">BUILD_2026_02_08_V1</span>
                            </div>
                        </div>
                    </div>

                    {/* Database Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Database size={18} className="text-amber-500" />
                            数据库连接
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">连接状态:</span>
                                <span className={`font-bold ${dbStatus === 'Connected' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {dbStatus === 'Connected' ? '● 正常' : '○ 失败'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">企业总数:</span>
                                <span className="font-medium">{summary?.total_enterprises || 0} 家</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">最新数据月份:</span>
                                <span className="font-medium">{summary?.dataYear}年12月</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Component Preview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-500" />
                        新功能验证：堆叠条形图 (Stacked Bars)
                    </h2>
                    <div className="h-64 border border-dashed border-slate-200 rounded-lg p-4">
                        <BarChartSection
                            data={industryData.slice(0, 5)}
                            showShortage={true}
                            color="#3b82f6"
                            shortageColor="#f97316"
                        />
                    </div>
                    <p className="mt-4 text-xs text-slate-400">
                        * 验证说明：蓝色代表在岗人数，橙色代表缺工人数（已放大显示）。悬浮条上应显示真实数据。
                    </p>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 text-xs italic">
                        该页面仅供开发人员测试使用，请勿分享给非技术人员。
                    </p>
                </div>
            </main>
        </div>
    );
}

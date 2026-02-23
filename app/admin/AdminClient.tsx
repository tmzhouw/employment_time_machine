'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Building2, Search, Download, AlertTriangle, Edit2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { approveReport, rejectReport } from './actions';

export default function AdminClient({ initialData, reportMonth }: { initialData: any[], reportMonth: string }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingReport, setEditingReport] = useState<any>(null);
    const [correctedEmployees, setCorrectedEmployees] = useState<string>('');
    const [recruitedNew, setRecruitedNew] = useState<string>('');
    const [resignedTotal, setResignedTotal] = useState<string>('');
    const [shortageGeneral, setShortageGeneral] = useState<string>('');
    const [shortageTech, setShortageTech] = useState<string>('');
    const [shortageMgmt, setShortageMgmt] = useState<string>('');
    const [plannedRecruitment, setPlannedRecruitment] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Reject state
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Month navigation
    const [yearStr, monthStr] = reportMonth.split('-');
    const displayYear = yearStr;
    const displayMonth = monthStr;

    const navigateMonth = (delta: number) => {
        let y = parseInt(yearStr, 10);
        let m = parseInt(monthStr, 10) + delta;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        const newMonth = `${y}-${String(m).padStart(2, '0')}-01`;
        router.push(`/admin?month=${newMonth}`);
    };

    const isCurrentMonth = () => {
        const now = new Date();
        return parseInt(yearStr) === now.getFullYear() && parseInt(monthStr) === (now.getMonth() + 1);
    };

    const filtered = initialData.filter(r =>
        r.name.includes(searchTerm) ||
        (r.town && r.town.includes(searchTerm)) ||
        (searchTerm === '预警' && r.hasWarning) ||
        (searchTerm === '待审' && r.status === 'SUBMITTED') ||
        (searchTerm === '未报' && r.status === 'PENDING') ||
        (searchTerm === '驳回' && r.status === 'REJECTED')
    );

    const metrics = {
        total: initialData.length,
        submitted: initialData.filter(r => r.status === 'APPROVED' || r.status === 'SUBMITTED').length,
        pending: initialData.filter(r => r.status === 'PENDING').length,
        warnings: initialData.filter(r => r.hasWarning && r.status === 'SUBMITTED').length,
        rejected: initialData.filter(r => r.status === 'REJECTED').length
    };
    const completionRate = metrics.total > 0 ? ((metrics.submitted / metrics.total) * 100).toFixed(1) : 0;

    const handleApprove = async () => {
        if (!editingReport) return;
        setIsSaving(true);
        try {
            await approveReport(
                editingReport.id,
                reportMonth,
                correctedEmployees ? parseInt(correctedEmployees, 10) : undefined,
                recruitedNew ? parseInt(recruitedNew, 10) : 0,
                resignedTotal ? parseInt(resignedTotal, 10) : 0,
                {
                    general: parseInt(shortageGeneral, 10) || 0,
                    tech: parseInt(shortageTech, 10) || 0,
                    management: parseInt(shortageMgmt, 10) || 0
                },
                parseInt(plannedRecruitment, 10) || 0
            );
            setEditingReport(null);
            router.refresh();
        } catch (err: any) {
            alert('操作失败: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReject = async () => {
        if (!editingReport || !rejectReason.trim()) return;
        setIsSaving(true);
        try {
            await rejectReport(editingReport.id, reportMonth, rejectReason);
            setEditingReport(null);
            setShowRejectForm(false);
            setRejectReason('');
            router.refresh();
        } catch (err: any) {
            alert('驳回失败: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // CSV Export
    const handleExport = () => {
        const headers = ['企业名称', '所属乡镇', '上月在职', '本月新招', '本月离职', '本月在职', '缺普工', '缺技工', '缺管理', '缺编合计', '计划招聘', '状态'];
        const rows = filtered.map(r => [
            r.name,
            r.town || '',
            r.prevEmployees || 0,
            r.recruitedNew || 0,
            r.resignedTotal || 0,
            r.currentEmployees || 0,
            r.shortageDetail?.general || 0,
            r.shortageDetail?.tech || 0,
            r.shortageDetail?.management || 0,
            (r.shortageDetail?.general || 0) + (r.shortageDetail?.tech || 0) + (r.shortageDetail?.management || 0),
            r.plannedRecruitment || 0,
            r.status === 'APPROVED' ? '已通过' : r.status === 'SUBMITTED' ? '待审核' : r.status === 'REJECTED' ? '已驳回' : '未填报'
        ]);

        const BOM = '\uFEFF';
        const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `用工监测_${displayYear}年${displayMonth}月.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Month Picker */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-5 py-2 bg-white rounded-lg border border-gray-200 shadow-sm font-bold text-gray-800 text-lg tabular-nums">
                    {displayYear}年{displayMonth}月
                </div>
                <button
                    onClick={() => navigateMonth(1)}
                    disabled={isCurrentMonth()}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                {!isCurrentMonth() && (
                    <button
                        onClick={() => router.push('/admin')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-2 underline underline-offset-2"
                    >
                        回到本月
                    </button>
                )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6">
                    <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> 责任企业总数
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{metrics.total}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6">
                    <div className="text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> 已填报
                    </div>
                    <div className="text-3xl font-bold text-green-600">{metrics.submitted}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6 relative overflow-hidden">
                    <div className="text-sm font-medium text-orange-500 mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 未填报
                    </div>
                    <div className="text-3xl font-bold text-orange-500">{metrics.pending}</div>
                    {(metrics.warnings > 0 || metrics.rejected > 0) && (
                        <div className="absolute top-0 right-0 h-full w-28 bg-gradient-to-l from-red-50 to-transparent flex flex-col items-center justify-center pr-3 border-l border-red-50 gap-1">
                            {metrics.warnings > 0 && (
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-red-600">{metrics.warnings}</span>
                                    <span className="block text-[9px] text-red-500 font-medium whitespace-nowrap">待审异常</span>
                                </div>
                            )}
                            {metrics.rejected > 0 && (
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-orange-600">{metrics.rejected}</span>
                                    <span className="block text-[9px] text-orange-500 font-medium whitespace-nowrap">已驳回</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md p-5 pl-6 text-white">
                    <div className="text-sm font-medium text-indigo-100 mb-1">
                        月度填报率
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="text-3xl font-bold">{completionRate}%</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
                    <h3 className="font-semibold text-gray-800">月度数据监测名单</h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="搜索企业、乡镇，或输入'未报','预警','驳回'..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shrink-0 whitespace-nowrap shadow-sm"
                        >
                            <Download className="w-4 h-4" /> 导出本页
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm backdrop-blur">
                            <tr>
                                <th className="px-6 py-3 font-medium text-slate-500 w-1/3">企业名称</th>
                                <th className="px-6 py-3 font-medium text-slate-500">所属乡镇</th>
                                <th className="px-6 py-3 font-medium text-slate-500">本月人数</th>
                                <th className="px-6 py-3 font-medium text-slate-500">填报进度 / 状态</th>
                                <th className="px-6 py-3 font-medium text-slate-500">最后更新</th>
                                <th className="px-6 py-3 font-medium text-slate-500 w-24">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((r) => (
                                <tr key={r.id} className={`transition-colors ${r.hasWarning && r.status === 'SUBMITTED' ? 'bg-red-50/30 hover:bg-red-50/60' : r.status === 'REJECTED' ? 'bg-orange-50/30 hover:bg-orange-50/60' : 'hover:bg-slate-50'}`}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{r.town || '无'}</td>
                                    <td className="px-6 py-4 font-mono text-gray-700">
                                        {r.currentEmployees > 0 ? r.currentEmployees : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2 items-start">
                                            {r.status === 'APPROVED' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> 已通过
                                                </div>
                                            ) : r.status === 'SUBMITTED' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    <Clock className="w-3.5 h-3.5" /> 待人工审核
                                                </div>
                                            ) : r.status === 'REJECTED' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                    <XCircle className="w-3.5 h-3.5" /> 已驳回
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                    待处理
                                                </div>
                                            )}

                                            {r.hasWarning && r.status === 'SUBMITTED' && (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 border border-red-200" title={r.warningDetails}>
                                                    <AlertTriangle className="w-3 h-3" /> 异动过大
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs" suppressHydrationWarning>
                                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {(r.status === 'SUBMITTED' || r.status === 'APPROVED' || r.status === 'REJECTED') && (
                                            <button
                                                onClick={() => {
                                                    setEditingReport(r);
                                                    setRecruitedNew(r.recruitedNew?.toString() || '0');
                                                    setResignedTotal(r.resignedTotal?.toString() || '0');
                                                    setShortageGeneral(r.shortageDetail?.general?.toString() || '0');
                                                    setShortageTech(r.shortageDetail?.tech?.toString() || '0');
                                                    setShortageMgmt(r.shortageDetail?.management?.toString() || '0');
                                                    setPlannedRecruitment(r.plannedRecruitment?.toString() || '0');
                                                    setCorrectedEmployees(r.currentEmployees.toString());
                                                    setShowRejectForm(false);
                                                    setRejectReason('');
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-sm font-medium p-1.5 hover:bg-indigo-50 rounded-md transition-colors border border-transparent hover:border-indigo-100 shadow-sm shadow-transparent hover:shadow-indigo-100/50"
                                            >
                                                <Edit2 className="w-4 h-4" /> {r.status === 'APPROVED' ? '修正' : r.status === 'REJECTED' ? '重审' : '去审核'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        无法找到匹配的企业记录
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit & Edit Modal */}
            {editingReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-indigo-600" />人工审核与校准
                            </h3>
                            <button onClick={() => { setEditingReport(null); setShowRejectForm(false); }} className="text-gray-400 hover:text-gray-600 transition-colors text-xl">×</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">目标企业</h4>
                                <p className="text-base font-bold text-gray-900">{editingReport.name}</p>

                                {editingReport.hasWarning && (
                                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex gap-2 items-start">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-red-800">触发波动预警</p>
                                            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{editingReport.warningDetails}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reference Number */}
                            <div className="flex items-center gap-2 text-sm bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                <span className="text-gray-500">📊 参考数据：</span>
                                <span className="font-medium text-gray-700">
                                    上月末在职 <span className="font-bold text-indigo-700">{editingReport.prevEmployees || 0}</span> 人
                                </span>
                            </div>

                            {/* Reject Form (toggleable) */}
                            {showRejectForm ? (
                                <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
                                    <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                        <XCircle className="w-4 h-4" /> 驳回此报告
                                    </h4>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="请输入驳回原因，企业将看到此消息..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-white resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleReject}
                                            disabled={isSaving || !rejectReason.trim()}
                                            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors text-sm"
                                        >
                                            {isSaving ? '驳回中...' : '确认驳回'}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectForm(false)}
                                            className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Core Audit Metrics */}
                                    <div className="space-y-4 pt-2">
                                        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">人员流动核实表</h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">本月新招入职</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={recruitedNew}
                                                        onChange={e => {
                                                            setRecruitedNew(e.target.value);
                                                            const base = editingReport.prevEmployees || 0;
                                                            const currentNew = parseInt(e.target.value || '0', 10);
                                                            const currentResigned = parseInt(resignedTotal || '0', 10);
                                                            setCorrectedEmployees(Math.max(0, base + currentNew - currentResigned).toString());
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                                                    />
                                                    <span className="absolute right-3 top-2 text-gray-400 text-xs mt-0.5">人</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">本月离职流失</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={resignedTotal}
                                                        onChange={e => {
                                                            setResignedTotal(e.target.value);
                                                            const base = editingReport.prevEmployees || 0;
                                                            const currentNew = parseInt(recruitedNew || '0', 10);
                                                            const currentResigned = parseInt(e.target.value || '0', 10);
                                                            setCorrectedEmployees(Math.max(0, base + currentNew - currentResigned).toString());
                                                        }}
                                                        className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono"
                                                    />
                                                    <span className="absolute right-3 top-2 text-gray-400 text-xs mt-0.5">人</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                            <div>
                                                <span className="block text-xs font-bold text-gray-600">本月末在职总数</span>
                                                <span className="block text-[10px] text-gray-400">系统自动推算 (不可改)</span>
                                            </div>
                                            <div className="text-2xl font-mono font-bold text-indigo-700">
                                                {correctedEmployees}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Needs */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 flex justify-between items-center">
                                            <span>企业服务诉求核实</span>
                                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                                缺编总计: {(parseInt(shortageGeneral, 10) || 0) + (parseInt(shortageTech, 10) || 0) + (parseInt(shortageMgmt, 10) || 0)} 人
                                            </span>
                                        </h4>

                                        <div className="grid grid-cols-3 gap-3 mb-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">缺普工</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={shortageGeneral}
                                                    onChange={e => setShortageGeneral(e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-orange-200 rounded focus:ring-1 focus:ring-orange-500 outline-none font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">缺技工</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={shortageTech}
                                                    onChange={e => setShortageTech(e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-orange-200 rounded focus:ring-1 focus:ring-orange-500 outline-none font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">缺管理/销售</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={shortageMgmt}
                                                    onChange={e => setShortageMgmt(e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-orange-200 rounded focus:ring-1 focus:ring-orange-500 outline-none font-mono text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">🎯 计划/急需招聘人数</label>
                                            <div className="relative w-1/2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={plannedRecruitment}
                                                    onChange={e => setPlannedRecruitment(e.target.value)}
                                                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-700"
                                                />
                                                <span className="absolute right-3 top-2.5 text-orange-400 text-xs mt-0.5">人</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 leading-relaxed bg-orange-50/50 p-2 rounded border border-orange-100/50 mt-4">
                                            ℹ️ 缺工结构将自动求和计入企业用工大盘。以上修改数据后点击立卷，将作为政府服务的权威认定值。
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center rounded-b-2xl border-t border-gray-100 sticky bottom-0">
                            {!showRejectForm && editingReport.status === 'SUBMITTED' && (
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5"
                                >
                                    <XCircle className="w-4 h-4" /> 驳回退回
                                </button>
                            )}
                            {showRejectForm && <div />}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={() => { setEditingReport(null); setShowRejectForm(false); }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                >
                                    取消
                                </button>
                                {!showRejectForm && (
                                    <button
                                        onClick={handleApprove}
                                        disabled={isSaving}
                                        className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isSaving ? '处理中...' : '审核通过并入库'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useMemo } from 'react';
import { Clock, Activity, ShieldCheck, Filter, X } from 'lucide-react';

const actionMap: Record<string, { label: string, color: string, badge: string }> = {
    'CREATE_ENTERPRISE': { label: '新建企业档案', color: 'text-emerald-700', badge: 'bg-emerald-100' },
    'UPDATE_ENTERPRISE': { label: '更新企业信息', color: 'text-amber-700', badge: 'bg-amber-100' },
    'UPDATE_PHONE': { label: '变更底座账号', color: 'text-amber-700', badge: 'bg-amber-100' },
    'CREATE_MANAGER': { label: '分配政府专员', color: 'text-blue-700', badge: 'bg-blue-100' },
    'RESET_PASSWORD': { label: '强制重置密码', color: 'text-rose-700', badge: 'bg-rose-100' },
    'CHANGE_OWN_PASSWORD': { label: '修改自身密码', color: 'text-purple-700', badge: 'bg-purple-100' },
    'APPROVE_REPORT': { label: '审批通过报告', color: 'text-green-700', badge: 'bg-green-100' },
    'REJECT_REPORT': { label: '驳回退回报告', color: 'text-red-700', badge: 'bg-red-100' },
};

export default function SystemClient({ initialData }: { initialData: any }) {
    const { logs } = initialData;

    const [filterAction, setFilterAction] = useState<string>('');
    const [filterDays, setFilterDays] = useState<number>(0); // 0 = all

    // Get all unique action types from logs
    const actionTypes = useMemo(() => {
        const types = new Set<string>();
        (logs || []).forEach((log: any) => types.add(log.action));
        return Array.from(types).sort();
    }, [logs]);

    // Filter logs
    const filteredLogs = useMemo(() => {
        if (!logs) return [];
        return logs.filter((log: any) => {
            if (filterAction && log.action !== filterAction) return false;
            if (filterDays > 0) {
                const logDate = new Date(log.created_at);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - filterDays);
                if (logDate < cutoff) return false;
            }
            return true;
        });
    }, [logs, filterAction, filterDays]);

    const hasFilters = filterAction || filterDays > 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        操作审计日志
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">全局记录系统内的敏感业务操作指令，保障数据资产安全追溯。</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-green-500/20" />
            </div>

            {/* Filters */}
            <div className="px-5 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center gap-3 shrink-0">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="">全部操作类型</option>
                    {actionTypes.map(type => (
                        <option key={type} value={type}>
                            {actionMap[type]?.label || type}
                        </option>
                    ))}
                </select>
                <select
                    value={filterDays}
                    onChange={e => setFilterDays(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value={0}>全部时间</option>
                    <option value={1}>最近 1 天</option>
                    <option value={7}>最近 7 天</option>
                    <option value={30}>最近 30 天</option>
                    <option value={90}>最近 90 天</option>
                </select>
                {hasFilters && (
                    <button
                        onClick={() => { setFilterAction(''); setFilterDays(0); }}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 ml-1"
                    >
                        <X className="w-3 h-3" /> 清除筛选
                    </button>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                    共 {filteredLogs.length} 条{hasFilters ? ` (筛选自 ${logs?.length || 0} 条)` : ''}
                </span>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg">
                            {hasFilters ? '没有符合条件的日志记录' : '暂无审计日志记录'}
                        </p>
                        {hasFilters && (
                            <button
                                onClick={() => { setFilterAction(''); setFilterDays(0); }}
                                className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 underline"
                            >
                                清除筛选条件
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent max-w-4xl mx-auto">
                        {filteredLogs.map((log: any) => {
                            const date = new Date(log.created_at);
                            const style = actionMap[log.action] || { label: log.action, color: 'text-gray-700', badge: 'bg-gray-100' };

                            return (
                                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                                        <Clock className="w-4 h-4" />
                                    </div>

                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-shadow group-hover:shadow-md">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.badge} ${style.color}`}>
                                                {style.label}
                                            </span>
                                            <time className="font-mono text-xs text-gray-400 font-medium">
                                                {date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </time>
                                        </div>
                                        <div className="text-sm text-gray-700 leading-relaxed">
                                            操作人 <span className="font-semibold text-gray-900 border-b border-gray-300 border-dashed">{log.admin_name}</span>
                                            {log.target_company_name ? (
                                                <> 对实体 <span className="font-semibold text-indigo-600">{log.target_company_name}</span> </>
                                            ) : (
                                                <> 对账号 <span className="font-semibold text-indigo-600">{log.target_user_name || log.details?.username}</span> </>
                                            )}
                                            执行了系统指令。
                                        </div>
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <div className="mt-4 bg-slate-50 p-3 rounded-md text-xs font-mono text-slate-600 border border-slate-200 overflow-x-auto">
                                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

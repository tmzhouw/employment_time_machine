'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { UserPlus, Clock, ShieldCheck, Activity, KeyRound } from 'lucide-react';
import { resetManagerPassword, changeAdminPassword } from './actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full py-2.5 rounded-lg text-white font-medium shadow-sm transition-all ${pending ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
        >
            {pending ? '创建中...' : '生成专员账号'}
        </button>
    );
}

export default function SystemClient({ initialData, createAction }: { initialData: any, createAction: any }) {
    const { managers, logs } = initialData;
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
    const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

    const handlePasswordChange = async (formData: FormData) => {
        setPwdMsg({ type: '', text: '' });
        const oldRaw = formData.get('oldRaw') as string;
        const newRaw = formData.get('newRaw') as string;
        const newRawConfirm = formData.get('newRawConfirm') as string;
        if (newRaw !== newRawConfirm) {
            setPwdMsg({ type: 'error', text: '两次输入的新密码不一致' });
            return;
        }
        try {
            await changeAdminPassword(oldRaw, newRaw);
            setPwdMsg({ type: 'success', text: '密码修改成功' });
            (document.getElementById('pwdForm') as HTMLFormElement).reset();
        } catch (err: any) {
            setPwdMsg({ type: 'error', text: err.message });
        }
    };

    const handleCreate = async (formData: FormData) => {
        setActionMsg({ type: '', text: '' });
        const res = await createAction(null, formData);
        if (res?.error) {
            setActionMsg({ type: 'error', text: res.error });
        } else if (res?.success) {
            setActionMsg({ type: 'success', text: res.message });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Manager Setup */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-slate-50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                            新增填报专员
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">创建可分配管辖企业的管理账号</p>
                    </div>
                    <form action={handleCreate} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">登录账号名称 <span className="text-red-500">*</span></label>
                            <input
                                name="username"
                                required
                                type="text"
                                minLength={4}
                                placeholder="例如: admin_zhang"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {actionMsg.text && (
                            <div className={`p-3 rounded-lg text-sm ${actionMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {actionMsg.text}
                            </div>
                        )}
                        <SubmitButton />
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">活跃专员列表 ({managers?.length || 0})</h3>
                    </div>
                    <ul className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                        {managers?.map((m: any) => (
                            <li key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{m.username}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{m.is_active ? '✅ 启用中' : '❌ 已停用'}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (confirm(`确定要将专员 ${m.username} 的密码重置为 123456 吗？`)) {
                                            try {
                                                await resetManagerPassword(m.id);
                                                alert('密码已成功重置为 123456');
                                            } catch (e: any) {
                                                alert('重置失败: ' + e.message);
                                            }
                                        }
                                    }}
                                    className="text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-md font-medium transition-colors"
                                >
                                    重置密码
                                </button>
                            </li>
                        ))}
                        {(!managers || managers.length === 0) && (
                            <li className="p-6 text-center text-sm text-gray-500">暂无专员账号</li>
                        )}
                    </ul>
                </div>

                {/* Admin Password Change Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-slate-50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-600" />
                            修改我的管理员密码
                        </h2>
                    </div>
                    <form id="pwdForm" action={handlePasswordChange} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">原密码</label>
                            <input name="oldRaw" required type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                            <input name="newRaw" required type="password" minLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                            <input name="newRawConfirm" required type="password" minLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        {pwdMsg.text && (
                            <div className={`p-3 rounded-lg text-sm ${pwdMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {pwdMsg.text}
                            </div>
                        )}
                        <button type="submit" className="w-full py-2.5 rounded-lg text-white font-medium shadow-sm bg-indigo-600 hover:bg-indigo-700 transition-colors">
                            确认修改
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Column: Audit Logs Timeline */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                    <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                超级管理员操作审计 (Audit Logs)
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">记录涉及账号生成、越权查询、信息变更等敏感指令</p>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-green-500/20" />
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30">
                        {(!logs || logs.length === 0) ? (
                            <div className="text-center py-12">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">暂无审计日志记录</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                {logs.map((log: any, idx: number) => {
                                    const date = new Date(log.created_at);

                                    // Translate action codes for UI
                                    const actionMap: Record<string, { label: string, color: string, badge: string }> = {
                                        'CREATE_ENTERPRISE': { label: '新建企业档案', color: 'text-emerald-700', badge: 'bg-emerald-100' },
                                        'UPDATE_PHONE': { label: '变更底座账号', color: 'text-amber-700', badge: 'bg-amber-100' },
                                        'CREATE_MANAGER': { label: '分配政府专员', color: 'text-blue-700', badge: 'bg-blue-100' },
                                        'RESET_PASSWORD': { label: '强制重置密码', color: 'text-rose-700', badge: 'bg-rose-100' },
                                    };

                                    const style = actionMap[log.action] || { label: log.action, color: 'text-gray-700', badge: 'bg-gray-100' };

                                    return (
                                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                                                <Clock className="w-4 h-4" />
                                            </div>

                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-shadow group-hover:shadow-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.badge} ${style.color}`}>
                                                        {style.label}
                                                    </span>
                                                    <time className="font-mono text-xs text-gray-400">
                                                        {date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </time>
                                                </div>
                                                <div className="text-sm text-gray-600 leading-relaxed">
                                                    操作人 <span className="font-medium text-gray-900 border-b border-gray-300 border-dashed">{log.admin_name}</span>
                                                    {log.target_company_name ? (
                                                        <> 对实体 <span className="font-medium text-indigo-600">{log.target_company_name}</span> </>
                                                    ) : (
                                                        <> 对账号 <span className="font-medium text-indigo-600">{log.target_user_name || log.details?.username}</span> </>
                                                    )}
                                                    执行了指令。
                                                </div>
                                                {log.details && Object.keys(log.details).length > 0 && (
                                                    <div className="mt-3 bg-slate-50 p-2 rounded-md text-xs font-mono text-slate-500 border border-slate-100">
                                                        {JSON.stringify(log.details)}
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
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { UserPlus, KeyRound, Building2, ShieldCheck, Search, Users } from 'lucide-react';
import { resetManagerPassword, resetEnterprisePassword, changeAdminPassword } from './actions';

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

const tabs = [
    { key: 'managers', label: '专员账号', icon: Users, count: 0 },
    { key: 'enterprises', label: '企业账号', icon: Building2, count: 0 },
    { key: 'admins', label: '管理员', icon: ShieldCheck, count: 0 },
];

export default function AccountsClient({ initialData, createAction }: { initialData: any, createAction: any }) {
    const { managers, enterprises, admins } = initialData;
    const [activeTab, setActiveTab] = useState('managers');
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
    const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
    const [entSearch, setEntSearch] = useState('');

    const tabCounts = { managers: managers?.length || 0, enterprises: enterprises?.length || 0, admins: admins?.length || 0 };

    const handleCreate = async (formData: FormData) => {
        setActionMsg({ type: '', text: '' });
        const res = await createAction(null, formData);
        if (res?.error) {
            setActionMsg({ type: 'error', text: res.error });
        } else if (res?.success) {
            setActionMsg({ type: 'success', text: res.message });
            (document.getElementById('createManagerForm') as HTMLFormElement).reset();
        }
    };

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

    const filteredEnterprises = (enterprises || []).filter((e: any) =>
        e.companyName.includes(entSearch) || e.username.includes(entSearch)
    );

    return (
        <div className="space-y-6">
            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const count = tabCounts[tab.key as keyof typeof tabCounts];
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                                }`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab 1: Specialist Managers */}
            {activeTab === 'managers' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-indigo-600" />
                                新增填报专员
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">创建可分配管辖企业的管理账号</p>
                        </div>
                        <form id="createManagerForm" action={handleCreate} className="p-5 space-y-4">
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
                        <div className="p-5 border-b border-gray-100 bg-slate-50">
                            <h3 className="font-bold text-gray-900">专员列表 ({managers?.length || 0})</h3>
                        </div>
                        <ul className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                            {managers?.map((m: any) => (
                                <li key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">{m.username}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {m.is_active ? '✅ 启用中' : '❌ 已停用'}
                                            {m.last_login && <span className="ml-2">· 最后登录: {new Date(m.last_login).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>}
                                        </p>
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
                                        className="text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-md font-medium transition-colors shrink-0"
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
                </div>
            )}

            {/* Tab 2: Enterprise Accounts */}
            {activeTab === 'enterprises' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3">
                        <h3 className="font-semibold text-gray-800">企业登录账号总览</h3>
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="搜索企业名称或账号..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                value={entSearch}
                                onChange={e => setEntSearch(e.target.value)}
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm backdrop-blur">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-500">企业名称</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">登录账号</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">状态</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">最后登录</th>
                                    <th className="px-6 py-3 font-medium text-slate-500 w-28">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEnterprises.map((e: any) => (
                                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{e.companyName}</td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">{e.username}</td>
                                        <td className="px-6 py-4">
                                            {e.is_active ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">启用</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">停用</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs" suppressHydrationWarning>
                                            {e.last_login ? new Date(e.last_login).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '从未登录'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`确定将 ${e.companyName} 的企业密码重置为 123456 吗？`)) {
                                                        try {
                                                            await resetEnterprisePassword(e.id);
                                                            alert(`${e.companyName} 的密码已重置为 123456`);
                                                        } catch (err: any) {
                                                            alert('重置失败: ' + err.message);
                                                        }
                                                    }
                                                }}
                                                className="text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-md font-medium transition-colors"
                                            >
                                                重置密码
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEnterprises.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            {entSearch ? '无匹配结果' : '暂无企业账号'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-slate-50 text-xs text-gray-500">
                        共 {enterprises?.length || 0} 个企业账号，当前显示 {filteredEnterprises.length} 条
                    </div>
                </div>
            )}

            {/* Tab 3: Admin Accounts */}
            {activeTab === 'admins' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-slate-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                超级管理员列表
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">拥有系统最高权限的管理账号</p>
                        </div>
                        <ul className="divide-y divide-gray-50">
                            {admins?.map((a: any) => (
                                <li key={a.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            {a.username}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">SUPER_ADMIN</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5" suppressHydrationWarning>
                                            {a.last_login
                                                ? `最后登录: ${new Date(a.last_login).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                                                : '从未登录'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400">只读</span>
                                </li>
                            ))}
                            {(!admins || admins.length === 0) && (
                                <li className="p-6 text-center text-sm text-gray-500">暂无管理员账号</li>
                            )}
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-indigo-600" />
                                修改我的密码
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
            )}
        </div>
    );
}

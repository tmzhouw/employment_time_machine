'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { UserPlus, KeyRound } from 'lucide-react';
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

export default function AccountsClient({ initialData, createAction }: { initialData: any, createAction: any }) {
    const { managers } = initialData;
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
            (document.getElementById('createManagerForm') as HTMLFormElement).reset();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Manager Setup & Lists */}
            <div className="space-y-6">
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
            </div>

            {/* Right Column: Other Account Operations */}
            <div className="space-y-6">
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

                <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                    <h3 className="text-sm font-bold text-orange-800 mb-2">💡 账号管理说明</h3>
                    <ul className="text-sm text-orange-700 space-y-2 list-disc pl-4">
                        <li><strong>填报专员账号：</strong> 负责联系辖区内企业，重置企业密码，辅助填写数据。</li>
                        <li><strong>企业账号：</strong> 请前往左侧“企业管理”中查看和分配企业账号列表。</li>
                        <li><strong>密码重置：</strong> 为了安全起见，所有被重置过密码的账号，在再次登录时都会被强制要求首先修改密码。</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useActionState, useEffect, useState } from 'react';
import { changePassword } from './actions';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ProfileClient() {
    const [state, formAction, isPending] = useActionState(changePassword, null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (state?.success) {
            setSuccessMessage('密码修改成功！下次登录请使用新密码。');
            const form = document.getElementById('password-form') as HTMLFormElement;
            if (form) form.reset();
        }
    }, [state]);

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="mb-6">
                <a href="/portal" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回我的主页
                </a>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">账号设置</h2>
                        <p className="text-sm text-gray-500">修改您的登录密码以确保账号安全</p>
                    </div>
                </div>

                <form id="password-form" action={formAction} className="space-y-5">
                    {state?.error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                            {state.error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg">
                            {successMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                        <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                            placeholder="至少6位字符"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                            placeholder="请再次输入新密码"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isPending ? '正在提交...' : '确认修改密码'}
                    </button>
                </form>
            </div>
        </div>
    );
}

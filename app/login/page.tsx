'use client';

import { useActionState } from 'react';
import { authenticateForm } from './actions';
import { Building2, KeyRound, Loader2 } from 'lucide-react';

const initialState = {
    error: '',
};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(authenticateForm, initialState);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-blue-600 px-6 py-8 text-center text-white">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-90" />
                    <h1 className="text-2xl font-bold mb-2 tracking-tight">企业用工填报舱</h1>
                    <p className="text-blue-100 text-sm">天门市重点工业企业运行监测系统</p>
                </div>

                <div className="p-8">
                    <form action={formAction} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                账号
                            </label>
                            <input
                                type="text"
                                name="username"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                placeholder="请输入您的账号"
                                disabled={isPending}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                密码
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder="••••••••"
                                    disabled={isPending}
                                />
                                <KeyRound className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        {state?.error && (
                            <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-start">
                                <span className="block sm:inline">{state.error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    登录中...
                                </>
                            ) : (
                                '登录系统'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        如果您遇到登录问题，请联系管理员
                    </p>
                </div>
            </div>
        </div>
    );
}

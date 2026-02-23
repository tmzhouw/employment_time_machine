'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // In a real production system, this is where we would send the raw error
        // to a logging service like Sentry or Datadog, keeping it out of the user's browser.
        console.error('Captured by Global Error Boundary:', error);
    }, [error]);

    const isDatabaseError = error.message.includes('PGRST') || error.message.includes('duplicate key') || error.message.includes('violates');
    const displayMessage = isDatabaseError
        ? '服务器繁忙或遇到数据处理错误，请联系系统管理员。(ErrorCode: SYS-DB-001)'
        : error.message || '系统遇到未知错误，请稍后重试。';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    系统服务暂时不可用
                </h2>

                <p className="text-sm text-gray-600 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {displayMessage}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        尝试刷新页面
                    </button>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        返回系统主页
                    </Link>
                </div>
            </div>
        </div>
    );
}

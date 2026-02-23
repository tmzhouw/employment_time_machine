'use client';

import { useState } from 'react';
import { generateAccount, resetPassword } from './actions';
import { Search, Key, UserPlus, FileDown, RefreshCw } from 'lucide-react';

interface AccountRow {
    companyId: string;
    companyName: string;
    town: string;
    hasAccount: boolean;
    userId?: string;
    username?: string;
    lastLogin?: string;
    createdAt?: string;
}

export default function AccountsClient({ initialAccounts }: { initialAccounts: AccountRow[] }) {
    const [accounts, setAccounts] = useState<AccountRow[]>(initialAccounts);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, CREATED, PENDING

    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleGenerate = async (companyId: string) => {
        if (!confirm('确认生成账号？初始密码将为123456')) return;
        setLoadingId(companyId);
        try {
            const res = await generateAccount(companyId);
            if (res.success) {
                alert(`生成成功！\n账号: ${res.username}\n初始密码: ${res.password}`);
                // Optimistic UI update or force reload
                window.location.reload();
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    const handleReset = async (userId: string) => {
        if (!confirm('确定将密权重置为123456吗？企业如果曾修改过密码将失效。')) return;
        setLoadingId(userId);
        try {
            const res = await resetPassword(userId);
            if (res.success) {
                alert('密码已成功重置为：123456');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    const filteredAccounts = accounts.filter(acc => {
        if (filterStatus === 'CREATED' && !acc.hasAccount) return false;
        if (filterStatus === 'PENDING' && acc.hasAccount) return false;

        if (searchTerm) {
            return acc.companyName.includes(searchTerm) || (acc.town || '').includes(searchTerm);
        }
        return true;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">企业账号分配</h2>
                    <p className="text-gray-500 mt-1">管理直报平台企业权限，一键生成初创账号及密码重置</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="搜索企业或乡镇..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="py-2 px-3 border border-gray-300 bg-white rounded-lg text-sm outline-none w-32 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">全部分配状态</option>
                            <option value="CREATED">已开通账号</option>
                            <option value="PENDING">未分配账号</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[700px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">企业名称</th>
                                <th className="px-6 py-3 font-medium text-gray-500">所属乡镇</th>
                                <th className="px-6 py-3 font-medium text-gray-500">账号状态</th>
                                <th className="px-6 py-3 font-medium text-gray-500">登录账号</th>
                                <th className="px-6 py-3 font-medium text-gray-500">最后登录</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">操作管理</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAccounts.map((acc) => (
                                <tr key={acc.companyId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{acc.companyName}</td>
                                    <td className="px-6 py-4 text-gray-600">{acc.town || '-'}</td>
                                    <td className="px-6 py-4">
                                        {acc.hasAccount ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 已开通
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                未分配
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-blue-600">
                                        {acc.username || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {acc.lastLogin ? new Date(acc.lastLogin).toLocaleString('zh-CN') : '从未登录'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {acc.hasAccount ? (
                                            <button
                                                onClick={() => handleReset(acc.userId!)}
                                                disabled={loadingId === acc.userId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                            >
                                                <Key className="w-3.5 h-3.5" />
                                                重置密码
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleGenerate(acc.companyId)}
                                                disabled={loadingId === acc.companyId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white border border-transparent rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                                一键生成
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        没有找到匹配的企业信息
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

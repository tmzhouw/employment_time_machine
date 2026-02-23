'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, ShieldAlert } from 'lucide-react';
import { updateEnterpriseData } from './actions';
import { useFormStatus } from 'react-dom';

function SubmitButton({ pendingStr = "保存中...", defaultStr = "保存" }: { pendingStr?: string, defaultStr?: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`px-4 py-2 rounded-lg text-white font-medium ${pending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
            {pending ? pendingStr : defaultStr}
        </button>
    );
}

export default function EnterprisesClient({ initialData, managers, createAction }: { initialData: any[], managers: any[], createAction: any }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Edit Modal State
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [editPayload, setEditPayload] = useState<any>({});
    const [editError, setEditError] = useState('');

    const filtered = initialData.filter(c =>
        c.name.includes(searchTerm) ||
        c.town.includes(searchTerm) ||
        (c.contact_phone && c.contact_phone.includes(searchTerm))
    );

    const handleEditSave = async () => {
        setEditError('');
        try {
            await updateEnterpriseData(editingCompany.id, editPayload);
            alert('企业档案及账号信息更新成功！');
            setEditingCompany(null);
            window.location.reload();
        } catch (err: any) {
            setEditError(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜索企业名称、乡镇或手机号..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    新增企业
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">企业名称</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">所属行业</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">联系人</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">HR 手机 (登录账号)</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">责任专员</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">账号状态</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-32">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((comp) => (
                                <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{comp.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{comp.town}</td>
                                    <td className="px-6 py-4 text-gray-600">{comp.industry || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{comp.contact_person || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                        {comp.contact_phone || <span className="text-gray-400 italic">未设置</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                                            {comp.manager_username}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {comp.auth ? (
                                            comp.auth.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 正常
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 封禁
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">无账号</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => {
                                                setEditingCompany(comp);
                                                setEditPayload({
                                                    name: comp.name,
                                                    town: comp.town,
                                                    industry: comp.industry || '',
                                                    contact_person: comp.contact_person || '',
                                                    contact_phone: comp.contact_phone || '',
                                                    manager_id: comp.manager_id || '',
                                                    is_active: comp.auth?.is_active ?? true,
                                                });
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center gap-1 hover:underline p-1"
                                            title="变更联系人"
                                        >
                                            <Edit2 className="w-4 h-4" /> 变更
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        未找到匹配的企业
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editing Modal */}
            {editingCompany && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-indigo-600" />
                                编辑企业档案 ({editingCompany.name})
                            </h3>
                            <button onClick={() => setEditingCompany(null)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">企业全称</label>
                                    <input
                                        type="text"
                                        value={editPayload.name}
                                        onChange={e => setEditPayload({ ...editPayload, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">所属乡镇</label>
                                    <select
                                        value={editPayload.town}
                                        onChange={e => setEditPayload({ ...editPayload, town: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="多祥">多祥镇</option>
                                        <option value="侯口">侯口街道</option>
                                        <option value="小板">小板镇</option>
                                        <option value="岳口">岳口镇</option>
                                        <option value="九真">九真镇</option>
                                        <option value="黄潭">黄潭镇</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">所属行业</label>
                                    <select
                                        value={editPayload.industry}
                                        onChange={e => setEditPayload({ ...editPayload, industry: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="">-- 请选择 --</option>
                                        <option value="纺织服装">纺织服装</option>
                                        <option value="生物医药化工">生物医药化工</option>
                                        <option value="装备制造">装备制造</option>
                                        <option value="农副产品深加工">农副产品深加工</option>
                                        <option value="电子信息">电子信息</option>
                                        <option value="其他">其他</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名</label>
                                    <input
                                        type="text"
                                        value={editPayload.contact_person}
                                        onChange={e => setEditPayload({ ...editPayload, contact_person: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">HR 手机号 (登录账号)</label>
                                    <input
                                        type="tel"
                                        maxLength={11}
                                        value={editPayload.contact_phone}
                                        onChange={e => setEditPayload({ ...editPayload, contact_phone: e.target.value.replace(/\D/g, '') })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-red-500 mt-1">修改此项将直接重置该企业的底层登录用户名</p>
                                </div>
                                <div className="md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3">系统授权管理 (超级管理员操作)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">指派填报管辖专员</label>
                                            <select
                                                value={editPayload.manager_id || ''}
                                                onChange={e => setEditPayload({ ...editPayload, manager_id: e.target.value || null })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="">-- 全局开放 / 未指派 --</option>
                                                {managers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.username}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">企业账号状态</label>
                                            <div className="flex items-center mt-2 cursor-pointer gap-2" onClick={() => setEditPayload({ ...editPayload, is_active: !editPayload.is_active })}>
                                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editPayload.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editPayload.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </div>
                                                <span className={`text-sm font-medium ${editPayload.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
                                                    {editPayload.is_active ? '✅ 启用 (正常填报)' : '🚫 停用 (冻结禁登)'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {editError && (
                                    <div className="md:col-span-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                                        {editError}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
                            <button
                                onClick={() => setEditingCompany(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={!editPayload.name || !editPayload.contact_phone || editPayload.contact_phone.length !== 11}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                确认保存变更
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Enterprise Form Modal - Uses form submission directly mapped to Server Action */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">新增企业档案</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form action={async (formData) => {
                            const result = await createAction(null, formData);
                            if (result?.error) {
                                alert(result.error);
                            } else if (result?.success) {
                                alert(result.message);
                                setIsAddModalOpen(false);
                            }
                        }}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">企业全称 <span className="text-red-500">*</span></label>
                                    <input name="name" required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="例如：天门市测试科技有限公司" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">所属乡镇 <span className="text-red-500">*</span></label>
                                    <select name="town" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option value="">-- 请选择 --</option>
                                        <option value="多祥">多祥镇</option>
                                        <option value="侯口">侯口街道</option>
                                        <option value="小板">小板镇</option>
                                        <option value="岳口">岳口镇</option>
                                        <option value="九真">九真镇</option>
                                        <option value="黄潭">黄潭镇</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">所属行业 <span className="text-red-500">*</span></label>
                                    <select name="industry" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option value="">-- 请选择 --</option>
                                        <option value="纺织服装">纺织服装</option>
                                        <option value="生物医药化工">生物医药化工</option>
                                        <option value="装备制造">装备制造</option>
                                        <option value="农副产品深加工">农副产品深加工</option>
                                        <option value="电子信息">电子信息</option>
                                        <option value="其他">其他</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名 <span className="text-red-500">*</span></label>
                                    <input name="contactPerson" required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="例如：张经理" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">HR 手机号 (作为系统登录账号) <span className="text-red-500">*</span></label>
                                    <input name="contactPhone" required type="tel" maxLength={11} pattern="\d{11}" title="请输入11位手机号码" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="11位手机号" />
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-blue-700 flex items-start gap-1">
                                        <span className="mt-0.5">ℹ️</span>
                                        保存后，系统将立即用此手机号为您生成登录账号，初始默认密码为 <b>123456</b>。请提示该企业HR保管并修改。
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900">取消</button>
                                <SubmitButton />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

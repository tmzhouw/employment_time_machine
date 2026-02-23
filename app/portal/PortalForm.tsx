'use client';

import { useState, useActionState, useEffect } from 'react';
import { submitReport } from './actions';
import { Loader2, CheckCircle2, ChevronRight, Info } from 'lucide-react';

const initialState: any = {
    error: '',
    success: false
};

interface PortalFormProps {
    company: any;
    baseEmployees: number; // Last month's total
    alreadySubmitted: boolean;
    reportMonth: string;
    lastReport?: any;
}

export default function PortalForm({ company, baseEmployees, alreadySubmitted, reportMonth, lastReport }: PortalFormProps) {
    const [state, formAction, isPending] = useActionState(submitReport, initialState);
    const [isSuccess, setIsSuccess] = useState(alreadySubmitted);

    // Form states for dynamic calculation
    const [newHires, setNewHires] = useState<number | string>(lastReport && alreadySubmitted ? lastReport.recruited_new : '');
    const [resignations, setResignations] = useState<number | string>(lastReport && alreadySubmitted ? lastReport.resigned_total : '');
    const [currentTotal, setCurrentTotal] = useState(baseEmployees);

    // Shortage detail states
    const existingShortage = (lastReport && alreadySubmitted && lastReport.shortage_detail) || {};
    const [shortageGeneral, setShortageGeneral] = useState<number | string>(lastReport && alreadySubmitted ? (existingShortage.general ?? 0) : '');
    const [shortageTech, setShortageTech] = useState<number | string>(lastReport && alreadySubmitted ? (existingShortage.tech ?? 0) : '');
    const [shortageMgmt, setShortageMgmt] = useState<number | string>(lastReport && alreadySubmitted ? (existingShortage.management ?? 0) : '');

    // Auto calculate shortage
    const shortageTotal = (Number(shortageGeneral) || 0) + (Number(shortageTech) || 0) + (Number(shortageMgmt) || 0);

    const [plannedRecruitment, setPlannedRecruitment] = useState<number | string>(lastReport && alreadySubmitted ? (lastReport.planned_recruitment ?? 0) : '');

    useEffect(() => {
        if (state?.success) {
            setIsSuccess(true);
        }
    }, [state]);

    // Recalculate current month total automatically
    useEffect(() => {
        // Base is last month's final number. Current = Base + New - Resigned
        // If already submitted, the baseEmployees passed by server might be this month's number,
        // so we shouldn't add/subtract from it again if they are just viewing it.
        if (!alreadySubmitted) {
            const calculatedTotal = baseEmployees + (Number(newHires) || 0) - (Number(resignations) || 0);
            setCurrentTotal(Math.max(0, calculatedTotal));
        } else if (lastReport) {
            setCurrentTotal(lastReport.employees_total);
        }
    }, [newHires, resignations, baseEmployees, alreadySubmitted, lastReport]);

    const displayMonth = reportMonth.slice(0, 7).replace('-', '年') + '月';

    if (isSuccess && !alreadySubmitted) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mt-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">提交成功！</h2>
                <p className="text-gray-600 mb-6">感谢您的配合，{company.name} {displayMonth} 的用工数据已成功上报。</p>
                <button
                    onClick={() => {
                        window.location.reload();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    返回首页
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
            <div className="bg-blue-50/50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">{displayMonth} 企业用工情况季报</h2>
                    <p className="text-sm text-gray-500 mt-1">{company.name} ({company.industry})</p>
                </div>
                {alreadySubmitted && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                        本月已提报
                    </span>
                )}
            </div>

            <form action={formAction} className="p-6">
                <input type="hidden" name="reportMonth" value={reportMonth} />
                <input type="hidden" name="employeesTotal" value={currentTotal} />

                {/* Section 1: Auto Calculate */}
                <div className="mb-8 p-5 bg-blue-50/30 rounded-xl border border-blue-100/50">
                    <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        用工人数核算 (自动计算)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">上月末在职人数</label>
                            <div className="text-2xl font-semibold text-gray-700">{baseEmployees} <span className="text-sm font-normal text-gray-400">人</span></div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">本月新招人数</label>
                            <input
                                type="number"
                                name="recruitedNew"
                                min="0"
                                value={newHires}
                                onChange={(e) => setNewHires(e.target.value)}
                                className="w-full sm:w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold"
                                disabled={alreadySubmitted}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">本月流失人数</label>
                            <input
                                type="number"
                                name="resignedTotal"
                                min="0"
                                value={resignations}
                                onChange={(e) => setResignations(e.target.value)}
                                className="w-full sm:w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-gray-900 font-semibold"
                                disabled={alreadySubmitted}
                            />
                        </div>
                    </div>
                    <div className="mt-6 pt-5 border-t border-blue-100 flex items-center justify-between">
                        <span className="text-gray-600 font-medium">确认本月末在职总数：</span>
                        <span className="text-3xl font-bold text-blue-600">{currentTotal} <span className="text-base font-normal">人</span></span>
                    </div>
                </div>

                {/* Section 2: Shortage & Recruitment Plan */}
                <div className="mb-8 p-5 bg-orange-50/50 rounded-xl border border-orange-100">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-orange-100 pb-2">当前用工缺口与招聘计划</h3>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            企业结构性缺编（理论缺口）
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">缺普工</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="shortageGeneral"
                                        min="0"
                                        value={shortageGeneral}
                                        onChange={(e) => setShortageGeneral(e.target.value)}
                                        className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                        disabled={alreadySubmitted}
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">人</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">缺技工</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="shortageTech"
                                        min="0"
                                        value={shortageTech}
                                        onChange={(e) => setShortageTech(e.target.value)}
                                        className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                        disabled={alreadySubmitted}
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">人</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">缺管理/销售</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="shortageMgmt"
                                        min="0"
                                        value={shortageMgmt}
                                        onChange={(e) => setShortageMgmt(e.target.value)}
                                        className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                        disabled={alreadySubmitted}
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">人</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            当前缺编总计 (自动计算)：<span className="text-lg font-bold text-orange-600 ml-1">{shortageTotal}</span> 人
                        </div>
                    </div>

                    <div className="pt-4 border-t border-orange-200">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            🎯 本月近期急需 / 计划招聘人数
                        </label>
                        <p className="text-xs text-gray-500 mb-3">（结合实际产能和资金安排，本月真正打算招募的人数）</p>
                        <div className="relative w-full sm:w-1/3">
                            <input
                                type="number"
                                name="plannedRecruitment"
                                min="0"
                                value={plannedRecruitment}
                                onChange={(e) => setPlannedRecruitment(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-bold text-lg placeholder:text-gray-400 placeholder:font-normal placeholder:text-base bg-white shadow-inner"
                                disabled={alreadySubmitted}
                                placeholder="填入计划人数"
                            />
                            <span className="absolute right-4 top-3.5 text-gray-500 font-medium">人</span>
                        </div>
                    </div>
                </div>

                {/* Section 3: Salary */}
                <div className="mb-8">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 border-b pb-2">薪酬极简调查 (用于生成市场竞争力得分)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 mb-1">
                                普工综合到手薪资
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="salaryGeneral"
                                    min="0"
                                    defaultValue={lastReport && alreadySubmitted ? lastReport.salary_general : ''}
                                    placeholder="如: 4500"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                    disabled={alreadySubmitted}
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">元/月</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 mb-1">
                                技工综合到手薪资
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="salaryTech"
                                    min="0"
                                    defaultValue={lastReport && alreadySubmitted ? lastReport.salary_tech : ''}
                                    placeholder="如: 6500"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                    disabled={alreadySubmitted}
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">元/月</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 mb-1">
                                管理/销售到手薪资
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="salaryMgmt"
                                    min="0"
                                    defaultValue={lastReport && alreadySubmitted ? existingShortage.salary_mgmt : ''}
                                    placeholder="如: 5000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal"
                                    disabled={alreadySubmitted}
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">元/月</span>
                            </div>
                        </div>
                    </div>
                </div>

                {state?.error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                        {state.error}
                    </div>
                )}

                {!alreadySubmitted && (
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:transform-none transform hover:-translate-y-0.5"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                正在提交并生成简报...
                            </>
                        ) : (
                            <>
                                确认提交数据
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                )}
            </form>
        </div>
    );
}

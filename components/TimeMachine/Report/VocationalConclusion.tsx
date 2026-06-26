'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface VocationalConclusionProps {
    dataYear: string;
    topShortageIndustry: string;
    techShortageRatio: number;
    upskillingIndustries: string[];
    targetCompanies: string[];
}

export function VocationalConclusion({
    dataYear,
    topShortageIndustry,
    techShortageRatio,
    upskillingIndustries,
    targetCompanies
}: VocationalConclusionProps) {
    const [mode, setMode] = useState<'template' | 'ai'>('template');
    const [aiText, setAiText] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load saved AI text on mount
    useEffect(() => {
        const saved = localStorage.getItem(`ai_conclusion_dean_${dataYear}`);
        if (saved) {
            setAiText(saved);
        }
    }, [dataYear]);

    // Auto-trigger AI generation when switching to AI mode if empty and no errors
    useEffect(() => {
        if (mode === 'ai' && !aiText && !isGenerating && !error) {
            handleGenerateAI();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, aiText, isGenerating, error]);

    const companyList = targetCompanies.slice(0, 3).join('、');

    // ===== AI Streaming Generation =====
    const handleGenerateAI = async () => {
        setIsGenerating(true);
        setError(null);
        setAiText('');

        try {
            const response = await fetch('/api/report/conclusion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'dean',
                    context: {
                        dataYear,
                        topShortageIndustry,
                        techShortageRatio,
                        upskillingIndustries,
                        targetCompanies
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                if (response.status === 500 && (errText.includes('Missing API Key') || errText.includes('Missing OPENAI_API_KEY'))) {
                    throw new Error('missing_key');
                }
                throw new Error(errText || '生成失败');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('无法读取响应流');

            const decoder = new TextDecoder();
            let done = false;
            let accumulatedText = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                accumulatedText += chunkValue;
                setAiText(accumulatedText);
            }

            localStorage.setItem(`ai_conclusion_dean_${dataYear}`, accumulatedText);
        } catch (err: any) {
            console.error(err);
            if (err.message === 'missing_key') {
                setError('key_missing');
            } else {
                setError(err.message || '连接 AI 服务失败，请重试。');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to render Markdown output with foolproof preamble filter
    function renderMarkdown(text: string) {
        // Foolproof filter: Find the index of the first heading (starts with ### or ##)
        const headingIndex = text.search(/(?:^|\n)#+\s+/);
        
        if (headingIndex === -1) {
            // While the AI is still typing the preamble, we show a clean loading indicator
            // so the user never sees any conversational greeting text
            return isGenerating ? (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium pl-8 py-2 animate-pulse no-print">
                    <Loader2 className="animate-spin" size={14} />
                    AI 正在根据产教融合指标流式输出决策参考...
                </div>
            ) : null;
        }

        // Slice the text from the first heading onward, completely discarding the preamble
        const cleanText = text.substring(headingIndex).trim();
        const lines = cleanText.split('\n');

        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-2" />;

            if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
                const headingText = trimmed.replace(/^#+\s*/, '');
                return (
                    <h3 key={idx} className="text-sm font-bold text-[#2c5282] mt-5 mb-3 first:mt-0 font-sans print:mt-4 print:mb-2">
                        {headingText}
                    </h3>
                );
            }

            const numberedMatch = trimmed.match(/^(\d+)\.\s*\*\*(.*?)\*\*(.*)$/);
            if (numberedMatch) {
                const [, num, boldPart, normalPart] = numberedMatch;
                return (
                    <p key={idx} className="indent-8 mb-2 print:mb-1.5 text-sm text-gray-700 leading-relaxed font-sans">
                        {num}. <strong>{boldPart}</strong>{normalPart}
                    </p>
                );
            }

            const boldMatch = trimmed.match(/^\*\*(.*?)\*\*(.*)$/);
            if (boldMatch) {
                const [, boldPart, normalPart] = boldMatch;
                return (
                    <p key={idx} className="indent-8 mb-2 print:mb-1.5 text-sm text-gray-700 leading-relaxed font-sans">
                        <strong>{boldPart}</strong>{normalPart}
                    </p>
                );
            }

            return (
                <p key={idx} className="indent-8 mb-2 print:mb-1.5 text-sm text-gray-700 leading-relaxed font-sans">
                    {trimmed}
                </p>
            );
        });
    }

    return (
        <section className="mb-8 print:mb-12 page-break-inside-avoid">
            <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-[#1e3a5f]">
                <h2 className="text-xl font-bold text-[#1e3a5f] font-serif">
                    七、职业教育与培训专项建议
                </h2>
                {/* Mode Selector - Hidden during print */}
                <div className="flex items-center gap-2 no-print">
                    <button
                        onClick={() => setMode('template')}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                            mode === 'template'
                                ? 'bg-[#1e3a5f] text-white font-medium border-[#1e3a5f]'
                                : 'bg-transparent text-gray-500 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        📝 传统分析
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                            mode === 'ai'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium border-amber-500 shadow-sm shadow-amber-500/10'
                                : 'bg-transparent text-gray-500 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <Sparkles size={12} />
                        AI 智能研判
                    </button>
                </div>
            </div>

            {mode === 'template' ? (
                // 传统模板模式
                <div>
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-[#2c5282] mb-2">（一）主要结论：供需错位与结构性矛盾依然突出</h3>
                        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                            <p className="indent-8 font-sans">
                                1. <strong>重点产业技能人才供给严重短缺。</strong> 监测数据显示，全市重点产业技术技能型人才缺口率达{techShortageRatio}%，“技能断层”现象在制造业领域尤为凸显，高技能人才培养滞后于产业升级需求。
                            </p>
                            <p className="indent-8 font-sans">
                                2. <strong>主导产业人才缺口呈现高集聚特征。</strong> {topShortageIndustry}作为首位主导产业，用工缺口最大且专业对口率要求高，是职业教育服务地方经济发展的核心主战场，供需匹配难度大。
                            </p>
                            <p className="indent-8 font-sans">
                                3. <strong>传统优势产业存量人才技能重塑需求迫切。</strong> {upskillingIndustries[0]}、{upskillingIndustries[1]}等产业在岗人员基数大，正处于技术改造和数字化转型关键期，“转岗培训”与“技能提升”需求持续旺盛。
                            </p>
                            <p className="indent-8 font-sans">
                                4. <strong>龙头企业用人导向由“单一技能”向“综合素养”转变。</strong> 以{companyList}为代表的劳动密集型龙头企业，对标准化作业人员的需求虽大，但更看重职业素养、岗位稳定性与执行力，单纯的技能培养已难以满足企业需求。
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-[#2c5282] mb-2">（二）对策建议：深化产教融合，构建全链条技能供给体系</h3>
                        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                            <p className="indent-8 font-sans">
                                1. <strong>优化专业布局，实施“紧缺技能”扩容行动。</strong> 紧扣“技工荒”痛点，建立专业设置动态调整机制。大幅压减行政管理等饱和专业招生规模，重点向数控技术、机电一体化、工业机器人等先进制造类专业倾斜，实现技工培养规模与产业需求同频共振。
                            </p>
                            <p className="indent-8 font-sans">
                                2. <strong>共建产业学院，打造“精准服务”产教联合体。</strong> 聚焦{topShortageIndustry}主导产业，深化“引企入教”改革。联合行业协会与链主企业，共建特色产业学院，推行“课程内容与职业标准、教学过程与生产过程”双对接，实现人才培养与产业需求“零距离”。
                            </p>
                            <p className="indent-8 font-sans">
                                3. <strong>推广新型学徒制，启动“存量人才”赋能工程。</strong> 针对{upskillingIndustries.join('、')}等传统优势行业，全面推广“招工即招生、入企即入校”的中国特色企业新型学徒制。主动对接企业培训需求，通过校企双师带徒模式，加速在岗职工技能迭代升级。
                            </p>
                            <p className="indent-8 font-sans">
                                4. <strong>强化素养培育，开设“稳定用工”定制订单班。</strong> 面向劳动密集型龙头企业，开设以“职业素养+基础技能”为核心的定向培养班。将吃苦耐劳、规范操作、安全生产等职业精神融入教学，通过顶岗实习前置磨合，降低企业试错成本与员工流失率，实现“入学即入职”的稳定就业。
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // AI 智能研判模式
                <div className="min-h-[200px] flex flex-col justify-start">
                    {!aiText && !isGenerating && !error ? (
                        // This fallback is only shown briefly, now it triggers automatically
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-blue-100 rounded-xl p-6 text-center space-y-4 no-print">
                            <div className="w-12 h-12 bg-blue-100/60 rounded-full flex items-center justify-center mx-auto">
                                <Sparkles className="text-amber-500" size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm text-slate-800">✨ 生成 AI 智能决策参考</h4>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    AI 将读取本报告中的产教融合与人才缺口数据，为您实时生成专属的职业教育专项建议。
                                </p>
                            </div>
                            <button
                                onClick={handleGenerateAI}
                                className="bg-[#1e3a5f] hover:bg-blue-800 text-white px-5 py-2 rounded-full text-xs font-medium transition-all shadow-md active:scale-95 flex items-center gap-1.5 mx-auto"
                            >
                                <Sparkles size={14} />
                                一键生成 AI 研判
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Action Buttons for AI Output - Hidden during print */}
                            {aiText && !isGenerating && (
                                <div className="absolute top-0 right-0 flex gap-2 no-print z-10">
                                    <button
                                        onClick={handleGenerateAI}
                                        className="text-xs text-gray-500 hover:text-[#1e3a5f] flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-all"
                                        title="重新生成"
                                    >
                                        <RefreshCw size={12} />
                                        重新生成
                                    </button>
                                </div>
                            )}

                            {/* Generative Text Area */}
                            <div className="space-y-2">
                                {renderMarkdown(aiText)}
                                {isGenerating && (
                                    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium pl-8 py-2 animate-pulse no-print">
                                        <Loader2 className="animate-spin" size={14} />
                                        AI 正在根据产教融合指标流式输出决策参考...
                                    </div>
                                )}
                            </div>

                            {/* Error States */}
                            {error && (
                                <div className="mt-4 no-print">
                                    {error === 'key_missing' ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-xs">
                                            <div className="flex gap-2 items-start">
                                                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                                <div>
                                                    <p className="font-bold mb-1">⚠️ 提示：未检测到 API 密钥</p>
                                                    <p>要运行 AI 智能研判功能，请在项目根目录 the <strong>.env.local</strong> 文件中配置您的密钥（二选一即可）：</p>
                                                    <div className="space-y-2 mt-2">
                                                        <div>
                                                            <p className="font-semibold text-amber-900">选项 1: DeepSeek API（推荐）</p>
                                                            <code className="block bg-amber-100/80 p-1.5 rounded font-mono select-all mt-0.5">
                                                                DEEPSEEK_API_KEY=您的_DeepSeek_密钥
                                                            </code>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-amber-900">选项 2: OpenAI API</p>
                                                            <code className="block bg-amber-100/80 p-1.5 rounded font-mono select-all mt-0.5">
                                                                OPENAI_API_KEY=您的_OpenAI_密钥
                                                            </code>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-[10px] text-amber-600">配置完成后，请刷新页面并重新点击生成即可。</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-xs">
                                            <div className="flex gap-2 items-start">
                                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                                <div>
                                                    <span className="font-semibold">生成出错：</span>{error}
                                                    <button 
                                                        onClick={handleGenerateAI}
                                                        className="mt-2 block bg-[#1e3a5f] hover:bg-blue-800 text-white px-3 py-1 rounded text-[10px] transition-colors"
                                                    >
                                                        重新尝试 (Retry)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>数据来源：{dataYear}年全年重点工业企业用工情况跟踪调查</p>
            </footer>
        </section>
    );
}

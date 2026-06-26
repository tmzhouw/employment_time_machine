'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface ReportConclusionProps {
    dataYear: string;
    growthRate: number;
    growthTrend: 'up' | 'down' | 'stable';
    startEmployment: number;
    endEmployment: number;
    netGrowth: number;
    topIndustriesShare: number;
    topIndustryName: string;
    topIndustrySharePct: number;
    topTowns: string[];
    topTownsShare: number;
    shortageRateNum: number;
    turnoverRateNum: number;
    topShortageIndustry: string;
    topTurnoverIndustry: string;
    talentGeneralTechPct: number;
    industryGrowthRates: { name: string; rate: number }[];
}

export function ReportConclusion(props: ReportConclusionProps) {
    const {
        dataYear,
        growthRate,
        growthTrend,
        startEmployment,
        endEmployment,
        netGrowth,
        topIndustriesShare,
        topIndustryName,
        topIndustrySharePct,
        topTowns,
        topTownsShare,
        shortageRateNum,
        turnoverRateNum,
        topShortageIndustry,
        topTurnoverIndustry,
        talentGeneralTechPct,
        industryGrowthRates,
    } = props;

    const [mode, setMode] = useState<'template' | 'ai'>('template');
    const [aiText, setAiText] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load saved AI text on mount
    useEffect(() => {
        const saved = localStorage.getItem(`ai_conclusion_general_${dataYear}`);
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

    const town1 = topTowns[0] || '重点乡镇';
    const town2 = topTowns[1] || '';
    const townPair = town2 ? `${town1}和${town2}` : town1;

    // Find top 2 growing industries (positive growth only)
    const growingIndustries = industryGrowthRates.filter(i => i.rate > 0);
    const top2Growth = growingIndustries.slice(0, 2);

    // ===== 传统模板：主要结论 =====
    const conclusions: { title: string; content: string }[] = [];

    if (growthTrend === 'up') {
        conclusions.push({
            title: '用工规模稳步增长。',
            content: `${dataYear}年天门市重点工业企业用工规模从年初的${startEmployment.toLocaleString()}人增长至年末的${endEmployment.toLocaleString()}人，净增长${netGrowth.toLocaleString()}人，增幅达${Math.abs(growthRate)}%，展现出良好的发展态势。`
        });
    } else if (growthTrend === 'down') {
        conclusions.push({
            title: '用工规模有所波动。',
            content: `${dataYear}年天门市重点工业企业用工规模从年初的${startEmployment.toLocaleString()}人变化至${endEmployment.toLocaleString()}人，降幅${Math.abs(growthRate)}%，需关注经济下行对就业的影响。`
        });
    } else {
        conclusions.push({
            title: '用工规模总体平稳。',
            content: `${dataYear}年天门市重点工业企业用工规模维持在${endEmployment.toLocaleString()}人左右，变动幅度仅${Math.abs(growthRate)}%，就业形势保持稳定。`
        });
    }

    conclusions.push({
        title: '产业结构特色鲜明。',
        content: `"一主两新三支撑"六大产业合计吸纳就业超过${topIndustriesShare}%，其中${topIndustryName}产业作为"一主"占比${topIndustrySharePct}%，充分体现了天门市的产业特色和优势。`
    });

    conclusions.push({
        title: '区域集聚效应明显。',
        content: `${townPair}作为两大产业集聚区，合计吸纳就业超过${topTownsShare}%，形成了"双核驱动"的产业发展格局。`
    });

    if (top2Growth.length >= 2) {
        conclusions.push({
            title: '新兴产业增长强劲。',
            content: `${top2Growth[0].name}产业增长率达${top2Growth[0].rate}%，${top2Growth[1].name}产业增长率达${top2Growth[1].rate}%，展现出强劲的发展势头。`
        });
    } else if (top2Growth.length === 1) {
        conclusions.push({
            title: '新兴产业增长亮眼。',
            content: `${top2Growth[0].name}产业增长率达${top2Growth[0].rate}%，带动全市产业升级步伐加快。`
        });
    }

    // ===== 传统模板：对策建议 =====
    const suggestions: { title: string; content: string }[] = [];

    suggestions.push({
        title: '加强技能人才培养。',
        content: talentGeneralTechPct > 0
            ? `针对普工和技工需求占比超过${talentGeneralTechPct}%的特点，加强与职业院校合作，开展订单式培养，提高本地劳动力技能水平。`
            : '深化校企合作，根据企业需求开展订单式培训，提升劳动者技能水平，解决"技工荒"问题。'
    });

    suggestions.push({
        title: '优化产业空间布局。',
        content: `围绕“融圈、联群、强市”战略路径，加快打造武汉都市圈先进制造业核心配套基地，强化侯口、多祥等核心园区建设，加快新材料和绿色循环等新兴产业园载体建设，促进就近就地就业。`
    });

    suggestions.push({
        title: '关注重点行业用工稳定性。',
        content: `针对${topTurnoverIndustry}产业人员流动率较高的问题，指导企业改善用工环境，提高员工福利待遇，降低人员流失率。`
    });

    suggestions.push({
        title: '完善公共就业服务。',
        content: '充分发挥乐业天门、天门直聘网等平台作用，加强用工信息对接，提高人岗匹配效率。'
    });

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
                    type: 'general',
                    context: {
                        dataYear,
                        growthRate,
                        growthTrend,
                        startEmployment,
                        endEmployment,
                        netGrowth,
                        topIndustriesShare,
                        topIndustryName,
                        topIndustrySharePct,
                        topTowns,
                        topTownsShare,
                        shortageRateNum,
                        turnoverRateNum,
                        topShortageIndustry,
                        topTurnoverIndustry,
                        talentGeneralTechPct,
                        industryGrowthRates
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

            localStorage.setItem(`ai_conclusion_general_${dataYear}`, accumulatedText);
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
                    AI 正在研判并流式输出结论...
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
                    七、结论与建议
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
                        <h3 className="text-sm font-bold text-[#2c5282] mb-3 print:mb-4">（一）主要结论</h3>
                        <div className="text-sm text-gray-700 leading-relaxed space-y-2 print:space-y-0">
                            {conclusions.map((c, i) => (
                                <p key={i} className="indent-8 mb-2 print:mb-2 font-sans">
                                    {i + 1}. <strong>{c.title}</strong> {c.content}
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-[#2c5282] mb-3 print:mb-4">（二）对策建议</h3>
                        <div className="text-sm text-gray-700 leading-relaxed space-y-2 print:space-y-0">
                            {suggestions.map((s, i) => (
                                <p key={i} className="indent-8 mb-2 print:mb-2 font-sans">
                                    {i + 1}. <strong>{s.title}</strong> {s.content}
                                </p>
                            ))}
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
                                <h4 className="font-bold text-sm text-slate-800">✨ 生成 AI 智能研判</h4>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    AI 将深度读取本报告中的数据上下文，为您实时流式撰写一份专业的公文研判报告。
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
                                        AI 正在研判并流式输出结论...
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
                                                    <p>要运行 AI 智能研判功能，请在项目根目录的 <strong>.env.local</strong> 文件中配置您的密钥（二选一即可）：</p>
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
                <p className="mb-1">天门市劳动就业管理局</p>
                <p>数据来源：{dataYear}年全年重点工业企业用工情况跟踪调查</p>
            </footer>
        </section>
    );
}

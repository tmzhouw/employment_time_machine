
'use client';

import { useChat } from '@ai-sdk/react';
import { Sparkles, Loader2, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AIAnalyst({ contextData }: { contextData: any }) {
    const { messages, append, isLoading, setMessages } = useChat({
        api: '/api/chat',
        initialMessages: []
    });

    const [hasStarted, setHasStarted] = useState(false);

    // Auto-scroll could be added here

    const handleStartAnalysis = () => {
        setHasStarted(true);
        setMessages([]); // Clear previous
        append({
            role: 'user',
            content: `作为政府就业数据分析师，请根据以下监测数据（含重点企业缺工与招聘TOP名单）撰写简报：

1. **总体研判**：当前全市用工供需是否平衡？（基于净增长和缺工率）
2. **结构性矛盾分析**：
   - 对比"缺工TOP"与"新招TOP"企业，是否存在"招工多但仍缺工"的现象（高流失）？
   - 哪些行业（如纺织/制造）缺口最大？
3. **政策建议**：针对当前缺工排名前列的企业，政府应采取什么具体帮扶措施？

数据上下文:
${JSON.stringify(contextData)}
`
        });
    };

    const lastMessage = messages.filter((m: any) => m.role === 'assistant').slice(-1)[0];

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl shadow-lg border border-blue-800 text-white overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-blue-800/50 flex items-center gap-2 bg-black/20">
                <Bot className="text-cyan-400" />
                <h2 className="font-bold text-lg">AI 智能分析师 (Trend Analyst)</h2>
            </div>

            <div className="flex-1 p-6 flex flex-col items-start justify-start overflow-y-auto min-h-[300px]">
                {!hasStarted ? (
                    <div className="m-auto text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="text-amber-400 animate-pulse" size={32} />
                        </div>
                        <p className="text-blue-200 max-w-xs mx-auto text-sm">
                            AI 将基于当前实时监测数据（294家企业，全年维度）为您生成深度研判报告。
                        </p>
                        <button
                            onClick={handleStartAnalysis}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-amber-900/20 active:scale-95 flex items-center gap-2 mx-auto"
                        >
                            <Sparkles size={18} />
                            生成研判报告 (One-Click Analysis)
                        </button>
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                        {messages.length === 0 && isLoading && (
                            <div className="flex items-center gap-2 text-blue-300 animate-pulse">
                                <Loader2 className="animate-spin" size={16} />
                                正在读取数据并构建分析模型...
                            </div>
                        )}

                        {messages.filter((m: any) => m.role === 'user').length > 0 && !lastMessage && isLoading && (
                            <div className="flex items-center gap-2 text-cyan-300">
                                <Loader2 className="animate-spin" size={16} />
                                AI 正在思考中...
                            </div>
                        )}

                        {lastMessage && (
                            <div className="prose prose-invert prose-sm max-w-none">
                                {/* Simple formatting for now, markdown support could be added */}
                                <div className="whitespace-pre-wrap leading-relaxed font-light text-blue-50">
                                    {lastMessage.content}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Disclaimer */}
            <div className="p-3 bg-black/30 text-xs text-blue-400 text-center border-t border-blue-800/30">
                Powered by Vercel AI SDK • Generate informative insights only
            </div>
        </div>
    );
}

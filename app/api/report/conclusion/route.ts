import { createOpenAI, openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

// Zero-dependency real-time web search helper (DuckDuckGo HTML scraping)
async function searchWeb(query: string): Promise<string> {
    try {
        console.log(`[searchWeb] Fetching latest search results for: "${query}"`);
        const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            // Cache the results for 30 minutes in Next.js to prevent rate limiting and keep it fast
            next: { revalidate: 1800 }
        } as any);

        if (!response.ok) throw new Error(`Search request failed with status ${response.status}`);
        const html = await response.text();
        
        const matches: string[] = [];
        const parts = html.split('class="result__snippet"');
        for (let i = 1; i < parts.length && i <= 5; i++) {
            const part = parts[i];
            const endIdx = part.indexOf('</a>');
            if (endIdx !== -1) {
                const snippet = part.substring(part.indexOf('>') + 1, endIdx)
                    .replace(/<[^>]*>/g, '') // Strip HTML tags
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .trim();
                matches.push(snippet);
            }
        }
        return matches.length > 0 ? matches.join('\n\n') : '未找到相关实时政策结果，请使用预设的最新战略。';
    } catch (error: any) {
        console.error('[searchWeb] Web search failed:', error);
        return '实时搜索连接失败，使用内置的最新政策数据库进行研判。';
    }
}

export async function POST(req: Request) {
    try {
        const { type, context } = await req.json();

        // 1. Run real-time web search to fetch the absolute latest slogans
        const searchResults = await searchWeb('天门市 最新 发展战略 口号 规划');

        // 2. Setup the AI model
        let model;
        if (process.env.DEEPSEEK_API_KEY) {
            const deepseek = createOpenAI({
                baseURL: process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1',
                apiKey: process.env.DEEPSEEK_API_KEY,
            });
            model = deepseek.chat('deepseek-chat');
        } else if (process.env.OPENAI_API_KEY) {
            model = openai('gpt-4o-mini');
        } else {
            return new Response("Missing API Key. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env.local", { status: 500 });
        }

        const isDean = type === 'dean';

        // 3. Inject the real-time search results into the system prompt with relative symmetry constraints
        const systemPrompt = isDean
            ? `你是一位服务于地方政府和职业教育管理机构的劳动就业与产教融合分析专家。
你的任务是根据提供的企业用工监测数据（JSON格式），撰写一份深度、专业的“职业教育与培训专项建议”报告结论。

【天门市最新官方战略口号与规划（实时联网搜索结果）】
${searchResults}

请确保你在编写主要结论与对策建议时，将上述搜索结果中体现的最新官方战略口号（例如：“加快建成新时代侨乡”、“融圈、联群、强市”、“打造武汉都市圈先进制造业核心配套基地”等）深度融入进去，使其具有极高的政治站位、实效性与现实政策对齐度。

【排版对称与美观要求】
为了符合政府公文排版的严谨与对称美感，请确保：
1. 每条结论和对策建议开头的“粗体核心句（即标题）”必须高度凝练、结构对称、长短一致。
2. 粗体标题 of the same section must have highly similar character lengths.

【严格禁言与废话过滤红线（极其重要）】
1. 绝对禁止输出任何开场白、引言、客套话或寒暄解释（例如：“好的，遵照您的指示”、“以下是为您生成的结论”、“收到，以下是分析报告”等）。
2. 绝对禁止输出任何结束语、总结发言或友好提示。
3. 必须直接、无任何前导字符地从第三级标题“### （一）主要结论：供需错位与结构性矛盾依然突出”开始输出内容。

报告必须分为以下两个部分，且严格遵循以下格式：
### （一）主要结论：供需错位与结构性矛盾依然突出
请结合数据提供 4 条核心结论，每条结论以“X. **[简短结论句]** [详细分析阐述]”的形式输出。分析需深入，包含具体的数据百分比或代表企业名称。
要点包括：
1. 重点产业技能人才短缺与“技能断层”情况（结合技术技能型人才缺口率）。
2. 首位主导产业的用工缺口与集聚特征（结合缺工最大的主导产业数据）。
3. 传统优势产业存量人才的技能提升与转型需求（结合需要技能提升的产业）。
4. 龙头企业的用人导向变化（结合具体的劳动密集型龙头企业）。

### （二）对策建议：深化产教融合，构建全链条技能供给体系
请针对结论提供 4 条具体、可操作的政策与教学建议，每条建议以“X. **[核心建议句]** [具体实施路径阐述]”的形式输出。
建议维度包括：
1. 优化专业布局，实施紧缺技能扩容（结合制造类专业等）。
2. 共建产业学院，打造精准服务产教联合体（结合主导产业，必须与天门市最新的“融圈、联群、强市”及“新时代侨乡”战略契合）。
3. 推广企业新型学徒制，启动存量人才赋能工程（结合传统优势行业）。
4. 强化职业素养培育，开设稳定用工定制班（降低龙头企业流失率）。

风格要求：
- 语言专业、严谨、深思熟虑，符合政府决策参考公文风格。
- 每条分析和建议要充实具体，不假大空。
- 严禁编造不属于上下文的数据。`
            : `你是一位服务于政府就业局的资深劳动就业数据分析专家。
你的任务是根据提供的企业用工监测数据（JSON格式），撰写一份专业、严谨的“结论与建议”报告内容。

【天门市最新官方战略口号与规划（实时联网搜索结果）】
${searchResults}

请确保你在编写主要结论与对策建议时，将上述搜索结果中体现的最新官方战略口号（例如：“加快建成新时代侨乡”、“融圈、联群、强市”、“打造武汉都市圈先进制造业核心配套基地”等）深度融入进去，使其具有极高的政治站位、实效性与现实政策对齐度。

【排版对称与美观要求】
为了符合政府公文排版的严谨与对称美感，请确保：
1. 每条结论和对策建议开头的“粗体核心句（即标题）”必须高度凝练、结构对称、长短一致。
2. 粗体标题 of the same section must have highly similar character lengths.

【严格禁言与废话过滤红线（极其重要）】
1. 绝对禁止输出任何开场白、引言、客套话或寒暄解释（例如：“好的，遵照您的指示”、“以下是为您生成的结论”、“收到，以下是分析报告”等）。
2. 绝对禁止输出任何结束语、总结发言或友好提示。
3. 必须直接、无任何前导字符地从第三级标题“### （一）主要结论”开始输出内容。

报告必须分为以下两个部分，且严格遵循以下格式：
### （一）主要结论
请结合数据提供 4 条核心结论，每条结论以“X. **[简短结论句]** [详细分析阐述]”的形式输出。分析需要有数据支撑（如用工规模变化、产业占比、区域集聚度等）。
要点包括：
1. 用工总体规模与增减趋势研判。
2. “一主两新三支撑”产业结构特征及主导产业吸纳就业占比。
3. 区域用工集聚效应（结合核心吸纳就业的乡镇）。
4. 新兴产业的发展增势（结合增长率较好的行业）。

### （二）对策建议
请针对结论提供 4 条具体、有政策针对性的对策建议，每条建议以“X. **[核心建议句]** [具体实施路径阐述]”的形式输出。
建议维度包括：
1. 技能人才培养与政校企合作（深度对接天门市“新时代侨乡”及“融圈、联群、强市”等最新发展战略规划）。
2. 产业空间布局优化与大园区建设。
3. 重点行业用工稳定性管理（针对流失率较高的行业给出改善用工环境等建议）。
4. 完善公共就业与信息对接平台服务。

风格要求：
- 语言专业、稳重，符合政府官方公文的措辞与语气。
- 每条分析和建议要有深度，结合数据层层剖析。
- 严禁编造不属于上下文的数据。`;

        const userPrompt = `监测数据上下文: ${JSON.stringify(context, null, 2)}`;

        const result = streamText({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

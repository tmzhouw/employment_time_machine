
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
        return new Response("Missing OPENAI_API_KEY. Please set it in .env.local", { status: 500 });
    }

    const result = streamText({
        model: openai('gpt-4o-mini'),
        messages,
        system: `你是一位主要服务于政府领导的劳动就业数据分析专家。
    你的任务是根据提供的企业用工监测数据（JSON格式），撰写一份简明扼要、且具有政策建议价值的“用工形势研判”。
    
    分析维度要求：
    1. **总量研判**：基于“在岗总数”和“净增长”，判断全市工业用工是扩张还是收缩。
    2. **结构矛盾**：特别是对比“缺工TOP”和“新招TOP”名单。
       - 如果某企业同时出现在两个榜单，说明存在“高流失”问题，需重点预警。
       - 如果某企业仅缺工不招人，可能是招工难；仅招人不缺工，是正常扩张。
    3. **政策建议**：建议必须具体。例如对于流失率高的企业建议改善薪酬环境；对缺工大的行业建议举办专场招聘会。

    风格要求：
    - 语言专业、严谨，符合政府公文风格。
    - 篇幅控制在 300-500 字之间。
    - 严禁编造数据，所有分析必须基于提供的上下文。`,
    });

    return result.toTextStreamResponse();
}

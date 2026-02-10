
import React from 'react';

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

export function ReportConclusion({
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
}: ReportConclusionProps) {
    const town1 = topTowns[0] || '重点乡镇';
    const town2 = topTowns[1] || '';
    const townPair = town2 ? `${town1}和${town2}` : town1;
    const townShort = town2 ? `${town1}、${town2}` : town1;

    // Find top 2 growing industries (positive growth only)
    const growingIndustries = industryGrowthRates.filter(i => i.rate > 0);
    const top2Growth = growingIndustries.slice(0, 2);

    // ===== 主要结论 =====
    const conclusions: { title: string; content: string }[] = [];

    // 1. Growth conclusion with specific numbers
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

    // 2. Industry structure
    conclusions.push({
        title: '产业结构特色鲜明。',
        content: `"一主两新三支撑"六大产业合计吸纳就业超过${topIndustriesShare}%，其中${topIndustryName}产业作为"一主"占比${topIndustrySharePct}%，充分体现了天门市的产业特色和优势。`
    });

    // 3. Regional clustering
    conclusions.push({
        title: '区域集聚效应明显。',
        content: `${townPair}作为两大产业集聚区，合计吸纳就业超过${topTownsShare}%，形成了"双核驱动"的产业发展格局。`
    });

    // 4. New industry growth (if we have growth data)
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

    // ===== 对策建议 =====
    const suggestions: { title: string; content: string }[] = [];

    // 1. Talent training
    suggestions.push({
        title: '加强技能人才培养。',
        content: talentGeneralTechPct > 0
            ? `针对普工和技工需求占比超过${talentGeneralTechPct}%的特点，加强与职业院校合作，开展订单式培养，提高本地劳动力技能水平。`
            : '深化校企合作，根据企业需求开展订单式培训，提升劳动者技能水平，解决"技工荒"问题。'
    });

    // 2. Industrial layout optimization
    suggestions.push({
        title: '优化产业空间布局。',
        content: `围绕"一城四基地"战略，强化侯口、多祥两大核心园区建设，加快新材料和绿色循环等新兴产业园载体建设，促进就近就地就业。`
    });

    // 3. Turnover management
    suggestions.push({
        title: '关注重点行业用工稳定性。',
        content: `针对${topTurnoverIndustry}产业人员流动率较高的问题，指导企业改善用工环境，提高员工福利待遇，降低人员流失率。`
    });

    // 4. Public employment services
    suggestions.push({
        title: '完善公共就业服务。',
        content: '充分发挥乐业天门、天门直聘网等平台作用，加强用工信息对接，提高人岗匹配效率。'
    });

    return (
        <section className="mb-8 print:mb-12 page-break-inside-avoid">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                七、结论与建议
            </h2>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（一）主要结论</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    {conclusions.map((c, i) => (
                        <p key={i} className="indent-8">
                            {i + 1}. <strong>{c.title}</strong> {c.content}
                        </p>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（二）对策建议</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    {suggestions.map((s, i) => (
                        <p key={i} className="indent-8">
                            {i + 1}. <strong>{s.title}</strong> {s.content}
                        </p>
                    ))}
                </div>
            </div>

            {/* Report Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                <p className="mb-1">天门市劳动就业管理局</p>
                <p>数据来源：{dataYear}年全年重点工业企业用工情况跟踪调查</p>
            </footer>
        </section>
    );
}

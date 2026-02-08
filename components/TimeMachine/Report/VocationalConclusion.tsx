
import React from 'react';

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
    const companyList = targetCompanies.slice(0, 3).join('、');

    return (
        <section className="mb-8 print:mb-12 page-break-inside-avoid">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                七、职业教育与培训专项建议
            </h2>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（一）主要结论</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p className="indent-8">
                        1. <strong>重点产业技能型人才供需结构性矛盾。</strong> 数据显示全市重点产业技术技能型人才缺口占比达{techShortageRatio}%，"技工荒"现象在制造业中尤为显著，高技能人才供给严重不足。
                    </p>
                    <p className="indent-8">
                        2. <strong>主导产业人才缺口集聚效应表现强。</strong> {topShortageIndustry}作为我市主导产业，其用工缺口最大，且对专业对口率要求较高，是职业教育服务地方经济的主战场。
                    </p>
                    <p className="indent-8">
                        3. <strong>存量从业人员技能提升需求持续旺。</strong> {upskillingIndustries[0]}、{upskillingIndustries[1]}等传统优势产业在岗基数大，正处于技术改造和产业升级关键期，员工技能重塑需求迫切。
                    </p>
                    <p className="indent-8">
                        4. <strong>劳动密集型龙头企业用工量大质稳。</strong> 以天门武住电装有限公司、彤辉智能科技天门有限公司等为代表的制造类龙头企业，主要需求为标准化作业人员，对员工的职业素养、稳定性和执行力要求高于单一技能。
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（二）对策建议</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p className="indent-8">
                        1. <strong>调整优化专业布局扩大技工培养模。</strong> 建议紧扣"技工荒"痛点，适当缩减行政管理等过剩专业，大幅增加数控技术、机电一体化等工科专业招生计划。
                    </p>
                    <p className="indent-8">
                        2. <strong>共建现代产业学院精准服务主导产。</strong> 聚焦{topShortageIndustry}产业，深化"引企入教"，与行业协会共建特色产业学院，实现课程内容与职业标准无缝对接。
                    </p>
                    <p className="indent-8">
                        3. <strong>推行新型学徒制赋能存量人才升级。</strong> 针对{upskillingIndustries.join('、')}等行业，主动对接企业培训需求，全面推广"招工即招生、入企即入校"的企业新型学徒制培养模式。
                    </p>
                    <p className="indent-8">
                        4. <strong>强化职业素养培育定制稳定订单班。</strong> 针对此类劳动密集型企业，开设以"职业素养+基本技能"为核心的定向班，强化吃苦耐劳 and 规范操作意识，通过顶岗实习提前磨合，有效降低企业员工流失率。
                    </p>
                </div>
            </div>

            {/* No footer unit here as requested */}
            <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>数据来源：{dataYear}年全年重点工业企业用工情况跟踪调查</p>
            </footer>
        </section>
    );
}

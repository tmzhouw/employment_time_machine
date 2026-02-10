
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
        <section className="mb-8 print:mb-12">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                七、职业教育与培训专项建议
            </h2>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（一）主要结论：供需错位与结构性矛盾依然突出</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p className="indent-8">
                        1. <strong>重点产业技能人才供给严重短缺。</strong> 监测数据显示，全市重点产业技术技能型人才缺口率达{techShortageRatio}%，“技能断层”现象在制造业领域尤为凸显，高技能人才培养滞后于产业升级需求。
                    </p>
                    <p className="indent-8">
                        2. <strong>主导产业人才缺口呈现高集聚特征。</strong> {topShortageIndustry}作为首位主导产业，用工缺口最大且专业对口率要求高，是职业教育服务地方经济发展的核心主战场，供需匹配难度大。
                    </p>
                    <p className="indent-8">
                        3. <strong>传统优势产业存量人才技能重塑需求迫切。</strong> {upskillingIndustries[0]}、{upskillingIndustries[1]}等产业在岗人员基数大，正处于技术改造和数字化转型关键期，“转岗培训”与“技能提升”需求持续旺盛。
                    </p>
                    <p className="indent-8">
                        4. <strong>龙头企业用人导向由“单一技能”向“综合素养”转变。</strong> 以{companyList}为代表的劳动密集型龙头企业，对标准化作业人员的需求虽大，但更看重职业素养、岗位稳定性与执行力，单纯的技能培养已难以满足企业需求。
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（二）对策建议：深化产教融合，构建全链条技能供给体系</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p className="indent-8">
                        1. <strong>优化专业布局，实施“紧缺技能”扩容行动。</strong> 紧扣“技工荒”痛点，建立专业设置动态调整机制。大幅压减行政管理等饱和专业招生规模，重点向数控技术、机电一体化、工业机器人等先进制造类专业倾斜，实现技工培养规模与产业需求同频共振。
                    </p>
                    <p className="indent-8">
                        2. <strong>共建产业学院，打造“精准服务”产教联合体。</strong> 聚焦{topShortageIndustry}主导产业，深化“引企入教”改革。联合行业协会与链主企业，共建特色产业学院，推行“课程内容与职业标准、教学过程与生产过程”双对接，实现人才培养与产业需求“零距离”。
                    </p>
                    <p className="indent-8">
                        3. <strong>推广新型学徒制，启动“存量人才”赋能工程。</strong> 针对{upskillingIndustries.join('、')}、装备制造等传统优势行业，全面推广“招工即招生、入企即入校”的中国特色企业新型学徒制。主动对接企业培训需求，通过校企双师带徒模式，加速在岗职工技能迭代升级。
                    </p>
                    <p className="indent-8">
                        4. <strong>强化素养培育，开设“稳定用工”定制订单班。</strong> 面向劳动密集型龙头企业，开设以“职业素养+基础技能”为核心的定向培养班。将吃苦耐劳、规范操作、安全生产等职业精神融入教学，通过顶岗实习前置磨合，降低企业试错成本与员工流失率，实现“入学即入职”的稳定就业。
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

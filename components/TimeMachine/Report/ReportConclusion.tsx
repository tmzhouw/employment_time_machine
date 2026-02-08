
import React from 'react';

export function ReportConclusion() {
    return (
        <section className="mb-8 print:mb-12 page-break-inside-avoid">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                七、结论与建议
            </h2>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（一）主要结论</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p className="indent-8">
                        1. <strong>用工规模稳步增长。</strong> 全市重点企业用工总量保持上升态势，显示出经济发展的良好基本面。
                    </p>
                    <p className="indent-8">
                        2. <strong>产业集聚效应明显。</strong> "一主两新三支撑"产业吸纳了绝大部分就业人口，侯口、多祥等重点乡镇作为产业高地，支撑作用显著。
                    </p>
                    <p className="indent-8">
                        3. <strong>结构性缺工依然存在。</strong> 普工和技工短缺仍是主要矛盾，部分新兴产业对高技能人才的需求难以完全满足。
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-[#2c5282] mb-2">（二）对策建议</h3>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p className="indent-8">
                        1. <strong>加强技能人才培养。</strong> 深化校企合作，根据企业需求开展订单式培训，提升劳动者技能水平，解决"技工荒"问题。
                    </p>
                    <p className="indent-8">
                        2. <strong>优化公共就业服务。</strong> 依托乐业天门等平台，加大招工宣传力度，举办多形式招聘活动，提高人岗匹配效率。
                    </p>
                    <p className="indent-8">
                        3. <strong>改善企业用工环境。</strong> 引导企业提升薪酬待遇，改善工作生活环境，增强企业吸引力和员工归属感，降低流失率。
                    </p>
                    <p className="indent-8">
                        4. <strong>促进区域协调发展。</strong> 在强化核心园区建设的同时，引导劳动密集型产业向劳动力资源丰富的乡镇延伸，促进就地就近就业。
                    </p>
                </div>
            </div>

            {/* Report Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                <p className="mb-1">天门市劳动就业管理局</p>
                <p>数据来源：2025年全年重点工业企业用工情况跟踪调查</p>
            </footer>
        </section>
    );
}


import React from 'react';
import { Users, UserPlus, TrendingUp, AlertCircle } from 'lucide-react';

interface ReportOverviewProps {
    totalCompanies: number;
    avgEmployees: number;
    totalNewHires: number;
    netGrowth: number;
    growthRate: number;
    shortageRate: string;
    dataYear: string;
}

// Government style colors
const COLORS = {
    primary: "#1e3a5f", // Deep Blue
    secondary: "#2c5282",
    accent: "#b8860b", // Gold
    text: "#374151"
};

export function ReportOverview({
    totalCompanies,
    avgEmployees,
    totalNewHires,
    netGrowth,
    growthRate,
    shortageRate,
    dataYear
}: ReportOverviewProps) {
    return (
        <section className="mb-8 print:mb-12">
            <h2 className="text-xl font-bold pb-2 mb-4 text-[#1e3a5f] border-b-2 border-[#1e3a5f] font-serif">
                一、总体概况
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <OverviewCard title="调查企业数" value={totalCompanies} unit="家" />
                <OverviewCard title="月均用工规模" value={avgEmployees.toLocaleString()} unit="人" />
                <OverviewCard title="全年新招人数" value={totalNewHires.toLocaleString()} unit="人" highlight />
                <OverviewCard title="缺工率" value={shortageRate} unit="" />
                <OverviewCard title="净增长人数" value={(netGrowth > 0 ? "+" : "") + netGrowth.toLocaleString()} unit="人" highlight />
                <OverviewCard title="员工增长率" value={(growthRate > 0 ? "+" : "") + growthRate + "%"} unit="同比" highlight />
            </div>

            <p className="leading-relaxed text-sm text-gray-700">
                {dataYear}年，天门市重点工业企业用工市场总体保持{growthRate > 0 ? '稳健增长' : growthRate < 0 ? '调整收缩' : '平稳运行'}态势。
                全年累计新招员工<strong>{totalNewHires.toLocaleString()}</strong>人，
                净增长<strong>{netGrowth.toLocaleString()}</strong>人。
                从数据来看，企业用工规模{growthRate > 0 ? '稳步扩大，显示出我市工业经济发展的良好韧性' : '有所调整，需关注企业用工需求变化'}。
            </p>
        </section>
    );
}

function OverviewCard({ title, value, unit, highlight }: { title: string, value: string | number, unit: string, highlight?: boolean }) {
    return (
        <div className="border border-blue-100 p-4 rounded bg-white print:border-gray-200">
            <div className="text-xs text-gray-500 mb-2">{title}</div>
            <div className={`text-2xl font-bold font-mono ${highlight ? 'text-[#b8860b]' : 'text-[#1e3a5f]'}`}>
                {value}
            </div>
            {unit && <div className="text-xs text-gray-400 mt-1">{unit}</div>}
        </div>
    );
}

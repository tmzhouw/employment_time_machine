import React from 'react';
import Link from 'next/link';
import { TrendingUp, Users, AlertCircle, Award, Briefcase, MapPin, Grid, Activity, BarChart2, ShieldCheck, Target } from 'lucide-react';
import {
  getTrendData,
  getIndustryDistribution,
  getReportSummary,
  getTopShortageCompanies,
  getTopRecruitingCompanies,
  getRegionalDistribution
} from '@/lib/data';
import { ChartSection } from '@/components/TimeMachine/ChartSection';
import { BarChartSection } from '@/components/TimeMachine/BarChartSection';
import { DualAxisTrendChart } from '@/components/TimeMachine/DualAxisTrendChart';
import { MetricCard } from '@/components/TimeMachine/MetricCard';
import { NavBar } from '@/components/TimeMachine/NavBar';
import clsx from 'clsx';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const filters = {};
  const ANNUAL_GOAL = 50000; // Simulated Annual Recruitment Goal

  const [trends, industryDist, summary, topShortage, topRecruiting, regionalDist] = await Promise.all([
    getTrendData(filters),
    getIndustryDistribution(filters),
    getReportSummary(filters),
    getTopShortageCompanies(5, filters),
    getTopRecruitingCompanies(5, filters),
    getRegionalDistribution(filters)
  ]);

  if (!summary) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <NavBar />
      <div className="text-xl font-bold text-gray-400 mt-20">Loading data...</div>
    </div>
  );

  // Calculate Progress
  const progressPercent = Math.min(100, (summary.net_growth / ANNUAL_GOAL) * 100).toFixed(1);
  const shortageRateVal = parseFloat(summary.shortage_rate.replace('%', ''));
  const isShortageRisk = shortageRateVal > 10;
  const isShortageWarning = shortageRateVal > 5;

  // Calculate Growth Rate
  // Growth Rate = Net Growth / (Current - Net Growth)
  // (Current - Net Growth) approximates the "Start of Year" number
  const startOfYear = (summary.avg_employment || 0) - (summary.net_growth || 0);
  const growthRate = startOfYear > 0
    ? ((summary.net_growth / startOfYear) * 100).toFixed(2) + '%'
    : 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <NavBar />


      <main className="max-w-7xl mx-auto p-6 space-y-8">

        {/* 1. Leader Cockpit Metrics */}
        <section>
          <MainSectionHeader number="一" title="全市用工概览 (2025全年)" />
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mt-1">数据来源：全市重点企业直报数据 (已校准)</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                数据已更新至 12月
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="调查企业数"
              value={summary.total_enterprises}
              unit="家"
              subLabel="覆盖重点工业企业"
            />
            <MetricCard
              title="在岗员工总数"
              value={summary.avg_employment.toLocaleString()}
              unit="人"
              subLabel="12月底实有"
            />
            <MetricCard
              title="企业缺工率"
              value={summary.shortage_rate}
              subLabel="当前紧缺程度"
              trend="down" // Assuming low is good
            />
            <MetricCard
              title="员工增长率"
              value={growthRate}
              subLabel="较年初"
              trend={parseFloat(growthRate) > 0 ? 'up' : 'down'}
              subValue={parseFloat(growthRate) > 0 ? '增长' : '下降'}
            />

            <MetricCard
              title="全年新招人数"
              value={summary.cumulative_recruited.toLocaleString()}
              unit="人"
              className="bg-blue-50/50 border-blue-100"
            />
            <MetricCard
              title="全年流失人数"
              value={summary.cumulative_resigned.toLocaleString()}
              unit="人"
              className="bg-orange-50/50 border-orange-100"
            />
            <MetricCard
              title="全年净增长"
              value={(summary.net_growth > 0 ? '+' : '') + summary.net_growth.toLocaleString()}
              unit="人"
              trend={summary.net_growth > 0 ? 'up' : 'down'}
              className="bg-emerald-50/50 border-emerald-100"
            />
            <MetricCard
              title="年流动率"
              value={summary.turnover_rate}
              subLabel="累计流失 / 现员"
            />
          </div>
        </section>

        {/* 2. Trends Analysis (Scissors Difference) */}
        <section>
          <MainSectionHeader number="二" title="供需趋势研判 (Trend Analysis)" />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6 h-[400px]">
            <HeaderTitle title="用工人数 vs 缺工人数 剪刀差分析" icon={<TrendingUp size={20} className="text-blue-600" />} />
            <div className="w-full h-[320px] mt-4">
              <DualAxisTrendChart data={trends} />
            </div>
          </div>
        </section>

        {/* 3. Lists (Red List & Honor List & Town Map) */}
        <section>
          <MainSectionHeader number="三" title="重点关注名单 (Key Focus Lists)" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">

            {/* Red List: Shortage */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <HeaderTitle title="重点缺工“红名单”" icon={<AlertCircle size={18} className="text-red-600" />} />
              <div className="mt-4 flex-1">
                {topShortage.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-red-100 text-red-600 text-xs font-bold rounded flex items-center justify-center">{idx + 1}</div>
                      <div>
                        <div className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.industry}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-bold text-sm">-{item.shortage}</div>
                      <div className="text-xs text-red-300">缺工</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Honor List: New Recruits */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <HeaderTitle title="招工纳税“光荣榜”" icon={<Award size={18} className="text-amber-500" />} />
              <div className="mt-4 flex-1">
                {topRecruiting.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-amber-100 text-amber-600 text-xs font-bold rounded flex items-center justify-center">{idx + 1}</div>
                      <div>
                        <div className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</div>
                        <div className="text-xs text-gray-400">累计新招</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-600 font-bold text-sm">+{item.value}</div>
                      <div className="text-xs text-amber-300">人</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Town Rankings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <HeaderTitle title="乡镇用工规模 TOP 10" icon={<MapPin size={18} className="text-indigo-600" />} />
              <div className="mt-4 flex-1 overflow-y-auto max-h-[400px]">
                <BarChartSection data={regionalDist.slice(0, 10)} />
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

function MainSectionHeader({ number, title }: { number: string, title: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-blue-900 text-white font-bold px-3 py-1 rounded text-lg font-serif">
        {number}
      </div>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    </div>
  );
}

function HeaderTitle({ title, icon, small }: any) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
      <div className="bg-blue-50 p-1.5 rounded-lg">{icon}</div>
      <h2 className={clsx("font-bold text-gray-800", small ? "text-base" : "text-lg")}>{title}</h2>
    </div>
  );
}

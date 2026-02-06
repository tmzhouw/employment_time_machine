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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <NavBar />

      {/* Hero / Disclaimer Section */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-2">
        <div className="bg-blue-900/5 border-l-4 border-blue-900 p-4 rounded-r shadow-sm flex items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-blue-900 font-bold flex items-center gap-2">
              <Activity size={18} />
              <span>全市就业局长驾驶舱 (Leader Cockpit)</span>
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              实时监测全市企业用工健康度、年度目标进度及重点风险预警。
            </p>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            数据更新时间: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-8">

        {/* 1. Core KPIs (The "Bureau Chief" View) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* KPI 1: Annual Goal Progress (Political Achievement) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target size={100} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-2 rounded-lg text-green-700"><Target size={20} /></div>
              <h3 className="font-bold text-gray-700">年度新增就业目标</h3>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold font-serif text-gray-900">{summary.net_growth.toLocaleString()}</span>
              <span className="text-sm text-gray-500">/ {ANNUAL_GOAL.toLocaleString()} 人</span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-green-700">当前进度: {progressPercent}%</span>
                <span className="text-gray-400">时间进度: {((new Date().getMonth() + 1) / 12 * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* KPI 2: Shortage Risk (Risk Management) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AlertCircle size={100} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className={clsx("p-2 rounded-lg text-white", isShortageRisk ? "bg-red-500" : (isShortageWarning ? "bg-amber-500" : "bg-blue-500"))}>
                <Activity size={20} />
              </div>
              <h3 className="font-bold text-gray-700">全市缺工风险监测</h3>
            </div>

            <div className="flex items-center gap-6 mt-2">
              <div>
                <div className="text-4xl font-bold font-serif text-gray-900">{summary.shortage_rate}</div>
                <div className="text-xs text-gray-500 mt-1">综合缺工率</div>
              </div>
              <div className="flex-1">
                <div className={clsx("text-lg font-bold mb-1", isShortageRisk ? "text-red-600" : (isShortageWarning ? "text-amber-600" : "text-blue-600"))}>
                  {isShortageRisk ? "高风险预警" : (isShortageWarning ? "中度关注" : "运行平稳")}
                </div>
                <div className="text-xs text-gray-400">
                  当前缺工 {summary.current_total_shortage.toLocaleString()} 人
                </div>
              </div>
            </div>

            <div className="mt-5 text-xs text-gray-400 bg-gray-50 p-2 rounded">
              建议关注: {topShortage[0]?.name.substring(0, 6)}... 等 {topShortage.length} 家重点缺工企业
            </div>
          </div>

          {/* KPI 3: Stability & Coverage (Foundation) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ShieldCheck size={100} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700"><ShieldCheck size={20} /></div>
              <h3 className="font-bold text-gray-700">就业稳定与覆盖</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-2xl font-bold font-serif text-gray-900">{summary.total_enterprises}</div>
                <div className="text-xs text-gray-500">监测企业(家)</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-serif text-indigo-600">96.5%</div>
                <div className="text-xs text-gray-500">人员稳岗率</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                在岗总人数
              </div>
              <div className="font-bold text-gray-900">{summary.avg_employment.toLocaleString()} <span className="text-xs font-normal text-gray-400">人</span></div>
            </div>
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

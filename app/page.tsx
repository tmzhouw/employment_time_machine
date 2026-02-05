import React from 'react';
import Link from 'next/link';
import { FileText, TrendingUp, Users, AlertCircle, Award, Briefcase, MapPin, Grid } from 'lucide-react';
import {
  getTrendData,
  getIndustryDistribution,
  getReportSummary,
  getTopShortageCompanies,
  getTopRecruitingCompanies,
  getRegionalDistribution,
  getFilterOptions
} from '@/lib/data';
import { ChartSection } from '@/components/TimeMachine/ChartSection';
import { BarChartSection } from '@/components/TimeMachine/BarChartSection';
import { FilterBar } from '@/components/TimeMachine/FilterBar';
// import { AIAnalyst } from '@/components/TimeMachine/AIAnalyst'; // Hidden for now
import clsx from 'clsx';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const filters = {
    industry: typeof searchParams.industry === 'string' ? searchParams.industry : undefined,
    town: typeof searchParams.town === 'string' ? searchParams.town : undefined,
  };

  // Pre-fetch filter options separately to populate dropdowns regardless of current filter
  const filterOptions = await getFilterOptions();

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
      <div className="text-xl font-bold text-gray-400">Searching data...</div>
      <p className="text-gray-500">Try adjusting your filters if no results found.</p>
      <Link href="/" className="text-blue-600 hover:underline">Clear Filters</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Navigation / Header - Blue/Gold Theme */}
      <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-20 border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-serif font-bold text-blue-900 text-xl shadow-inner">T</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">天门市企业用工时序监测大脑</h1>
              <p className="text-xs text-blue-200 mt-1">Tianmen Enterprise Employment Time-Machine</p>
            </div>
          </div>
          <Link href="/report" className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full transition-all backdrop-blur-sm group">
            <FileText size={16} className="text-amber-400 group-hover:text-amber-300" />
            <span>生成分析报告</span>
          </Link>
        </div>
      </nav>

      <FilterBar options={filterOptions} />

      <main className="max-w-7xl mx-auto p-6 space-y-12">

        {/* I. 总体概况 (General Overview) */}
        <section>
          <MainSectionHeader number="一" title="总体概况 (General Overview)" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <StatCard
              title="监测企业总数"
              value={summary.total_enterprises}
              unit="家"
              icon={<Briefcase size={18} className="text-blue-600" />}
              trend="Stable"
            />
            <StatCard
              title="当前在岗职工"
              value={summary.avg_employment.toLocaleString()}
              unit="人"
              icon={<Users size={18} className="text-indigo-600" />}
              trend="+1.2%"
            />
            <StatCard
              title="本年度累计新招"
              value={summary.cumulative_recruited.toLocaleString()}
              unit="人"
              icon={<AlertCircle size={18} className="text-amber-600" />}
              highlight
            />
            <StatCard
              title="人才净增长"
              value={`${summary.net_growth > 0 ? '+' : ''}${summary.net_growth.toLocaleString()}`}
              unit="人"
              icon={<TrendingUp size={18} className="text-green-600" />}
              trend="Positive"
            />
          </div>
        </section>

        {/* II. 月度趋势分析 (Monthly Trend Analysis) */}
        <section>
          <MainSectionHeader number="二" title="月度趋势分析 (Monthly Trend Analysis)" />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <HeaderTitle title="全市用工与缺工趋势" icon={<TrendingUp size={20} className="text-blue-600" />} />
            <div className="h-[350px] mt-4">
              <ChartSection data={trends} />
            </div>
          </div>
        </section>

        {/* III. 行业分布分析 (Industry Distribution Analysis) */}
        <section>
          <MainSectionHeader number="三" title="行业分布分析 (Industry Distribution Analysis)" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            {/* Industry Chart */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <HeaderTitle title="重点行业用工规模 TOP 10" icon={<Grid size={20} className="text-indigo-600" />} />
              <div className="h-[400px] mt-4">
                <BarChartSection data={industryDist.slice(0, 15)} />
              </div>
            </div>

            {/* Top Companies Tables (Shortage/Recruiting) - Moved here for context */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <HeaderTitle title="缺工企业 TOP 5" icon={<AlertCircle size={18} className="text-amber-600" />} small />
                <div className="mt-4">
                  <MiniTable
                    data={topShortage}
                    columns={[
                      { header: '企业名称', key: 'name', width: 'w-1/2' },
                      { header: '缺工数', key: 'shortage', align: 'right', className: 'text-amber-600 font-bold' },
                    ]}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <HeaderTitle title="新招企业 TOP 5" icon={<Award size={18} className="text-blue-600" />} small />
                <div className="mt-4">
                  <MiniTable
                    data={topRecruiting}
                    columns={[
                      { header: '企业名称', key: 'name', width: 'w-1/2' },
                      { header: '累计新招', key: 'value', align: 'right', className: 'text-blue-600 font-bold' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IV. 区域分布分析 (Regional Distribution Analysis) */}
        <section>
          <MainSectionHeader number="四" title="区域分布分析 (Regional Distribution Analysis)" />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <HeaderTitle title="各乡镇/区域用工人数分布" icon={<MapPin size={20} className="text-green-600" />} />
            <div className="h-[400px] mt-4">
              {/* Reuse BarChartSection for regions as well */}
              <BarChartSection data={regionalDist.slice(0, 20)} />
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

function StatCard({ title, value, unit, icon, highlight }: any) {
  return (
    <div className={clsx(
      "bg-white p-5 rounded-xl shadow-sm border transition-shadow hover:shadow-md",
      highlight ? "border-amber-200 bg-amber-50/10" : "border-gray-100"
    )}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className={clsx("text-2xl font-bold font-serif tracking-tight mt-1", highlight ? "text-amber-600" : "text-gray-900")}>
        {value} <span className="text-sm font-normal text-gray-400 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function MiniTable({ data, columns }: any) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-400 font-medium uppercase bg-gray-50 rounded-lg">
        <tr>
          {columns.map((col: any, i: number) => (
            <th key={i} className={clsx("px-3 py-2", col.align === 'right' ? "text-right" : "", col.width)}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((row: any, i: number) => (
          <tr key={i} className="hover:bg-blue-50/50 transition-colors">
            {columns.map((col: any, j: number) => (
              <td key={j} className={clsx("px-3 py-3 truncate max-w-[140px]", col.align === 'right' ? "text-right" : "", col.className)}>
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

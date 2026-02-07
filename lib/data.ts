import 'server-only'; // Ensure this runs only on server
import { supabaseAdmin as supabase } from './supabase-admin';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// Reusable filter helper
function applyFilters(data: any[], filters?: { industry?: string, town?: string, companyName?: string }) {
    if (!data || !filters) return data;
    return data.filter(row => {
        if (filters.industry && filters.industry !== '全部' && row.companies?.industry !== filters.industry) return false;
        if (filters.town && filters.town !== '全部' && row.companies?.town !== filters.town) return false;
        if (filters.companyName && !row.companies?.name.includes(filters.companyName)) return false;
        return true;
    });
}

// Core data fetcher (uncached)
async function _fetchAllRawDataFromDB() {
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from('monthly_reports')
            .select(`
                *,
                companies (name, industry, town)
            `)
            .order('id', { ascending: true })
            .range(from, to);

        if (error) {
            console.error('Fetch error', error);
            break;
        }

        if (data && data.length > 0) {
            allData = allData.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
        } else {
            hasMore = false;
        }
    }
    console.log(`[DB] Fetched ${allData.length} records from monthly_reports`);
    return allData;
}

// Layer 1: Cross-request cache with 5-minute TTL (Plan 1)
// This caches the DB result in Next.js Data Cache, revalidating every 300 seconds
const _cachedFetch = unstable_cache(
    _fetchAllRawDataFromDB,
    ['all-raw-data'],
    { revalidate: 300 } // 5 minutes
);

// Layer 2: Per-request deduplication (Plan 4)
// Within a single server render, multiple calls to fetchAllRawData() return the same Promise
const fetchAllRawData = cache(_cachedFetch);

export async function getTrendData(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Sort logic needs date objects
    filteredData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    // Filter for current/latest year to avoid summing across years
    const currentYear = new Date().getFullYear().toString();
    const allSortedDates = [...new Set(filteredData.map(d => d.report_month))].sort();
    const latestAvailableDate = allSortedDates[allSortedDates.length - 1];
    const targetYear = latestAvailableDate?.startsWith(currentYear) ? currentYear : (latestAvailableDate?.substring(0, 4) || currentYear);

    const yearData = filteredData.filter(d => d.report_month.startsWith(targetYear));

    // Aggregate by month
    const monthlyTotals = new Map();

    yearData.forEach(row => {
        const date = new Date(row.report_month);
        const monthKey = `${date.getMonth() + 1}月`;

        if (!monthlyTotals.has(monthKey)) {
            monthlyTotals.set(monthKey, { month: monthKey, total: 0, shortage: 0, sortInd: date.getTime() });
        }

        const cur = monthlyTotals.get(monthKey);
        cur.total += row.employees_total || 0;
        cur.shortage += row.shortage_total || 0;
    });

    return Array.from(monthlyTotals.values())
        .sort((a, b) => a.sortInd - b.sortInd)
        .map(({ month, total, shortage }) => ({ month, total, shortage }));
}

export async function getTopShortageCompanies(limit = 10, filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredGlobal = applyFilters(allData, filters);

    if (filteredGlobal.length === 0) return [];

    // Find latest month *within the filtered dataset*
    // Actually we should find the latest month globally? 
    // Usually "Current Shortage" means "Report Month = X". 
    // If we filter by industry, we still want the latest month for that industry.
    filteredGlobal.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = filteredGlobal[0].report_month;

    const currentMonthData = filteredGlobal.filter(d => d.report_month === latestMonth);

    return currentMonthData
        .filter((row: any) => row.shortage_total > 0)
        .sort((a: any, b: any) => b.shortage_total - a.shortage_total)
        .slice(0, limit)
        .map((row: any) => ({
            name: (Array.isArray(row.companies) ? row.companies[0]?.name : row.companies?.name) || 'Unknown',
            industry: (Array.isArray(row.companies) ? row.companies[0]?.industry : row.companies?.industry) || 'Other',
            shortage: row.shortage_total,
            rate: row.employees_total > 0
                ? ((row.shortage_total / (row.employees_total + row.shortage_total)) * 100).toFixed(1) + '%'
                : '0%'
        }));
}

export async function getTopRecruitingCompanies(limit = 10, filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Filter for current/latest year to avoid summing across years
    const currentYear = new Date().getFullYear().toString();
    const allSortedDates = [...new Set(filteredData.map(d => d.report_month))].sort();
    const latestAvailableDate = allSortedDates[allSortedDates.length - 1];
    const targetYear = latestAvailableDate?.startsWith(currentYear) ? currentYear : (latestAvailableDate?.substring(0, 4) || currentYear);
    const yearData = filteredData.filter(d => d.report_month.startsWith(targetYear));

    const totals = new Map();
    yearData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const name = comp?.name;
        if (!name) return;

        const cur = totals.get(name) || { name, industry: comp?.industry, value: 0 };
        cur.value += (row.recruited_new || 0);
        totals.set(name, cur);
    });

    return Array.from(totals.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

export async function getTopTurnoverCompanies(limit = 10, filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    const totals = new Map();
    // Filter for current/latest year to avoid summing across years
    const currentYear = new Date().getFullYear().toString();
    const allSortedDates = [...new Set(filteredData.map(d => d.report_month))].sort();
    const latestAvailableDate = allSortedDates[allSortedDates.length - 1];
    const targetYear = latestAvailableDate?.startsWith(currentYear) ? currentYear : (latestAvailableDate?.substring(0, 4) || currentYear);
    const yearData = filteredData.filter(d => d.report_month.startsWith(targetYear));

    yearData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const name = comp?.name;
        if (!name) return;

        const cur = totals.get(name) || { name, industry: comp?.industry, value: 0, recruited: 0 };
        cur.value += (row.resigned_total || 0);
        cur.recruited += (row.recruited_new || 0);
        totals.set(name, cur);
    });

    return Array.from(totals.values())
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, limit);
}

export async function getTopGrowthCompanies(limit = 10, filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // To calculate net growth RATE, we need:
    // 1. Net Growth (Dec - Jan)
    // 2. Start Employment (Jan, or calculated)

    // Filter for current/latest year to avoid summing across years
    const currentYear = new Date().getFullYear().toString();
    const allSortedDates = [...new Set(filteredData.map(d => d.report_month))].sort();
    const latestAvailableDate = allSortedDates[allSortedDates.length - 1];
    const targetYear = latestAvailableDate?.startsWith(currentYear) ? currentYear : (latestAvailableDate?.substring(0, 4) || currentYear);
    const yearData = filteredData.filter(d => d.report_month.startsWith(targetYear));

    // Group by company
    const companyMap = new Map();

    yearData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const name = comp?.name;
        if (!name) return;

        if (!companyMap.has(name)) {
            companyMap.set(name, { records: [] });
        }
        companyMap.get(name).records.push(row);
    });

    const growthStats: any[] = [];

    companyMap.forEach((val, name) => {
        const records = val.records;
        // Sort by date
        records.sort((a: any, b: any) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

        if (records.length === 0) return;

        const startRecord = records[0];
        const endRecord = records[records.length - 1];

        const startEmp = startRecord.employees_total || 0;
        const endEmp = endRecord.employees_total || 0;
        const comp = Array.isArray(startRecord.companies) ? startRecord.companies[0] : startRecord.companies;
        const industry = comp?.industry;

        const netGrowth = endEmp - startEmp;

        if (startEmp > 0) {
            const growthRate = (netGrowth / startEmp) * 100;
            growthStats.push({
                name,
                industry,
                value: netGrowth,
                rate: growthRate,
                rateLabel: growthRate.toFixed(1) + '%'
            });
        }
    });

    return growthStats
        .sort((a, b) => b.rate - a.rate)
        .slice(0, limit);
}

export async function getReportSummary(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return null;

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // Filter for current year (2025) for cumulative stats
    const currentYear = new Date().getFullYear().toString();
    // If no data for current year, fallback to latest available year
    const allSortedDates = [...new Set(filteredData.map(d => d.report_month))].sort();
    const latestAvailableDate = allSortedDates[allSortedDates.length - 1];
    const targetYear = latestAvailableDate?.startsWith(currentYear) ? currentYear : (latestAvailableDate?.substring(0, 4) || currentYear);

    const yearData = filteredData.filter(d => d.report_month.startsWith(targetYear));

    let cumulative_recruited = 0;
    let cumulative_resigned = 0;
    let net_growth = 0;

    yearData.forEach(r => {
        cumulative_recruited += r.recruited_new || 0;
        cumulative_resigned += r.resigned_total || 0;
        net_growth += ((r.recruited_new || 0) - (r.resigned_total || 0));
    });

    // Fetch latest month detailed data for current totals (Employment & Shortage)
    // We already have all data, just find latest date
    filteredData.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = filteredData[0].report_month;
    const latestData = filteredData.filter(d => d.report_month === latestMonth);

    const current_total_employees = latestData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);
    const current_total_shortage = latestData.reduce((acc, curr) => acc + (curr.shortage_total || 0), 0);

    // Calculate derived rates
    const turnover_rate = current_total_employees > 0
        ? ((cumulative_resigned / current_total_employees) * 100).toFixed(1) + '%'
        : '0%';

    const shortage_rate = (current_total_employees + current_total_shortage) > 0
        ? ((current_total_shortage / (current_total_employees + current_total_shortage)) * 100).toFixed(1) + '%'
        : '0%';

    // Calculate Net Growth based on: Latest Month Total - Earliest Month Total of TARGET YEAR
    // First, verify we have time span
    const yearSortedDates = [...new Set(yearData.map(d => d.report_month))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDate = yearSortedDates[0];
    const startData = yearData.filter(d => d.report_month === startDate);
    const start_total_employees = startData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);

    // If we have data for the year, use End - Start. If not, use the cumulative net growth we calculated.
    // Actually, usually End - Start is better if available.
    const net_growth_diff = current_total_employees - start_total_employees;

    return {
        total_enterprises,
        avg_employment: current_total_employees,
        start_employment: start_total_employees,
        cumulative_recruited,
        cumulative_resigned,
        net_growth: net_growth_diff, // Use the new difference logic
        net_growth_recruits_minus_resigned: net_growth, // Keep old one just in case
        turnover_rate,
        shortage_rate,
        current_total_shortage
    };
}

export async function getIndustryDistribution(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    // For Industry Distribution, if we select "Textile", we technically check "Is Textile Distribution within Textile?" -> It's 100%. 
    // But maybe we select Town, then we see Industry Dist within that Town. 
    // So yes, apply filters.
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return [];

    // Latest month only logic
    filteredData.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = filteredData[0].report_month;
    const currentData = filteredData.filter(d => d.report_month === latestMonth);

    const industryStats = new Map();

    currentData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const industry = comp?.industry || '其他';
        const current = industryStats.get(industry) || 0;
        industryStats.set(industry, current + (row.employees_total || 0));
    });

    return Array.from(industryStats.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

export async function getRegionalDistribution(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return [];

    // Latest month only logic
    filteredData.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = filteredData[0].report_month;
    const currentData = filteredData.filter(d => d.report_month === latestMonth);

    const townTotals = new Map<string, number>();

    currentData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const town = comp?.town || '未知';
        const currentVal = townTotals.get(town) || 0;
        townTotals.set(town, currentVal + (row.employees_total || 0));
    });

    return Array.from(townTotals.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

// Helper to get dropdown options
export async function getFilterOptions() {
    const allData = await fetchAllRawData(); // This is cached per request usually in Next.js deduping if we fetch again, but here it's function call. 
    // For performance, we might want to optimize. But for 3500 rows it's negligible.

    // Custom sort order
    const priorityOrder = [
        '纺织服装',
        '电子信息',
        '新能源新材料',
        '农副产品深加工',
        '生物医药化工', '生物医药（化工）', // Handle variations
        '装备制造', '装备制造产业', // Handle variations
        '商贸物流',
        '其他'
    ];

    const getPriority = (name: string) => {
        const index = priorityOrder.findIndex(p => name === p || name.includes(p));
        return index !== -1 ? index : 999;
    };

    // Unique Industries
    const industries = Array.from(new Set(allData.filter(d => d.companies?.industry).map(d => d.companies.industry)))
        .sort((a, b) => getPriority(a) - getPriority(b));

    // Unique Towns with Employee Count & Sorting
    // 1. Get latest data for each company to avoid double counting
    const companyMap = new Map();
    allData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());
    allData.forEach(row => {
        if (!row.companies?.name) return;
        companyMap.set(row.companies.name, row);
    });
    const latestData = Array.from(companyMap.values());

    // 2. Aggregate employees by town
    const townStats = new Map<string, number>();
    latestData.forEach((row: any) => {
        const town = row.companies?.town;
        const employees = row.employees_total || 0;
        if (town) {
            townStats.set(town, (townStats.get(town) || 0) + employees);
        }
    });

    // 3. Filter and Sort
    const sortedTowns = Array.from(townStats.entries())
        .filter(([town, count]) => count >= 50 && town !== '其他') // Filter out small towns and 'Other' for sorting
        .sort((a, b) => b[1] - a[1]) // Sort by employee count descending
        .map(([town]) => town);

    // 4. Add '其他' at the end (includes small towns implicitly in 'Other' option for UI purposes, though technically mapped to 'Other' string if needed in future)
    // Note: The requirement is "Below 50 merge into Other". 
    // For the filter dropdown options, we present the valid major towns. "Other" will be selectable.
    // Ideally we should ensure '其他' is present if there are small towns.
    const hasSmallTowns = Array.from(townStats.entries()).some(([town, count]) => count < 50) || townStats.has('其他');

    const towns = hasSmallTowns ? [...sortedTowns, '其他'] : sortedTowns;

    return { industries, towns };
}

export async function getEnterpriseList(page = 1, pageSize = 20, filters?: { industry?: string, town?: string, companyName?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Latest month only logic for the list "snapshot"
    if (filteredData.length === 0) return { data: [], total: 0 };

    // Group by company to get the latest record for each company
    // (Assuming the raw data might have multiple months for same company, we want the "current status" which is the latest month)
    const companyMap = new Map();

    // Sort by date ascending first, so we process latest last
    filteredData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    filteredData.forEach(row => {
        if (!row.companies?.name) return;
        // This will strictly overwrite with the latest month's data
        companyMap.set(row.companies.name, row);
    });

    const latestCompanyRecords = Array.from(companyMap.values());
    const total = latestCompanyRecords.length;

    // Pagination
    const start = (page - 1) * pageSize;
    const paginatedData = latestCompanyRecords
        .sort((a, b) => (b.employees_total || 0) - (a.employees_total || 0)) // Default sort by size
        .slice(start, start + pageSize)
        .map(row => ({
            id: row.company_id,
            name: row.companies?.name,
            industry: row.companies?.industry,
            town: row.companies?.town,
            employees: row.employees_total || 0,
            shortage: row.shortage_total || 0,
            new_recruits: row.recruited_new || 0, // Note: this is "new recruits in the latest month". 
            // If we want "Cumulative Recruits" we'd need to sum up all months for this company.
            // For now, let's keep it simple as "Latest Month Status".
            report_month: row.report_month
        }));

    return { data: paginatedData, total };
}

export async function getLatestCompaniesWithTrends() {
    const allData = await fetchAllRawData();

    // Group all records by company name to calculate cumulative stats
    const companyRecordsMap = new Map<string, any[]>();

    allData.forEach((row: any) => {
        if (!row.companies?.name) return;
        const name = row.companies.name;
        if (!companyRecordsMap.has(name)) {
            companyRecordsMap.set(name, []);
        }
        companyRecordsMap.get(name)!.push(row);
    });

    return Array.from(companyRecordsMap.entries()).map(([name, records]) => {
        // Sort records by date to get latest
        records.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());
        const latestRecord = records[records.length - 1];

        // Calculate cumulative values across all months
        const cumulativeRecruited = records.reduce((sum, r) => sum + (r.recruited_new || 0), 0);
        const cumulativeResigned = records.reduce((sum, r) => sum + (r.resigned_total || 0), 0);
        const peakShortage = Math.max(...records.map(r => r.shortage_total || 0));

        // Latest month values
        const employees = latestRecord.employees_total || 0;
        const monthlyRecruited = latestRecord.recruited_new || 0;
        const monthlyResigned = latestRecord.resigned_total || 0;
        const monthlyShortage = latestRecord.shortage_total || 0;

        const turnoverRate = employees > 0 ? (monthlyResigned / employees) * 100 : 0;

        return {
            name: latestRecord.companies?.name,
            industry: latestRecord.companies?.industry,
            town: latestRecord.companies?.town,
            employees: employees,
            // Monthly values
            monthlyShortage: monthlyShortage,
            monthlyRecruited: monthlyRecruited,
            monthlyResigned: monthlyResigned,
            // Cumulative/Peak values
            cumulativeRecruited: cumulativeRecruited,
            cumulativeResigned: cumulativeResigned,
            peakShortage: peakShortage,
            // Keep legacy fields for backward compatibility
            shortage: monthlyShortage,
            recruited: monthlyRecruited,
            resigned: monthlyResigned,
            turnoverRate: turnoverRate
        };
    });
}
// ============================================================================
// MULTI-YEAR TREND ANALYSIS FUNCTIONS (Phase 2)
// ============================================================================

interface MultiYearTrendPoint {
    month: string; // YYYY-MM format
    monthLabel: string; // Display format: 2025年1月
    employees: number;
    shortage: number;
    recruited: number;
    resigned: number;
}

interface YearMetrics {
    avgEmployees: number;
    totalRecruited: number;
    totalResigned: number;
    avgShortage: number;
    growthRate: number | null; // % growth from previous year
}

interface YearOverYearData {
    [year: string]: YearMetrics;
}

/**
 * Get aggregated monthly trend data across all years
 * Returns chronologically sorted data points with year-aware labels
 */
export async function getMultiYearTrendData(
    filters?: { industry?: string; town?: string }
): Promise<MultiYearTrendPoint[]> {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Group by YYYY-MM
    const monthlyAggregates = new Map<string, MultiYearTrendPoint>();

    filteredData.forEach((row: any) => {
        const date = new Date(row.report_month);
        const yearMonth = row.report_month.substring(0, 7); // YYYY-MM
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthLabel = `${year}年${month}月`;

        if (!monthlyAggregates.has(yearMonth)) {
            monthlyAggregates.set(yearMonth, {
                month: yearMonth,
                monthLabel: monthLabel,
                employees: 0,
                shortage: 0,
                recruited: 0,
                resigned: 0
            });
        }

        const aggregate = monthlyAggregates.get(yearMonth)!;
        aggregate.employees += row.employees_total || 0;
        aggregate.shortage += row.shortage_total || 0;
        aggregate.recruited += row.recruited_new || 0;
        aggregate.resigned += row.resigned_total || 0;
    });

    // Sort chronologically and return
    return Array.from(monthlyAggregates.values()).sort((a, b) => a.month.localeCompare(b.month));
}

// ============================================================================
// GEOGRAPHY ANALYSIS FUNCTIONS (Phase 3)
// ============================================================================

export interface TownStat {
    name: string;
    totalEmployees: number;
    shortageCount: number;
    shortageRate: number;
    topIndustry: string;
    turnoverRate: number;
    companyCount: number;
    talentStructure: {
        general: number;
        tech: number;
        mgmt: number;
    };
}

export async function getTownStats(filters?: { industry?: string }): Promise<TownStat[]> {
    const allData = await fetchAllRawData();
    // Filter by industry if provided (ignoring town filter as we want to see all towns)
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return [];

    // Latest month snapshot
    filteredData.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = filteredData[0].report_month;
    const currentData = filteredData.filter(d => d.report_month === latestMonth);

    // Group by Town
    const townGroups = new Map<string, {
        employees: number;
        shortage: number;
        recruited: number;
        resigned: number;
        companies: any[];
        talent: { general: number; tech: number; mgmt: number; };
    }>();

    currentData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const town = comp?.town || '未知';

        if (!townGroups.has(town)) {
            townGroups.set(town, {
                employees: 0,
                shortage: 0,
                recruited: 0,
                resigned: 0,
                companies: [],
                talent: { general: 0, tech: 0, mgmt: 0 }
            });
        }

        const group = townGroups.get(town)!;
        group.employees += (row.employees_total || 0);
        group.shortage += (row.shortage_total || 0);
        group.recruited += (row.recruited_new || 0);
        group.resigned += (row.resigned_total || 0);

        // Aggregate talent structure
        const detail = typeof row.shortage_detail === 'string'
            ? JSON.parse(row.shortage_detail)
            : (row.shortage_detail || {});

        group.talent.general += detail.general || 0;
        group.talent.tech += detail.tech || 0;
        group.talent.mgmt += detail.mgmt || 0;

        group.companies.push(row);
    });

    const stats: TownStat[] = [];

    townGroups.forEach((group, town) => {
        if (town === '未知' || town === '其他') return; // Optionally filter out unknowns

        // Find Top Industry
        const indCounts = new Map<string, number>();
        group.companies.forEach(row => {
            const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
            const ind = comp?.industry || '其他';
            indCounts.set(ind, (indCounts.get(ind) || 0) + (row.employees_total || 0));
        });

        const topIndustry = Array.from(indCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '综合';

        const turnoverRate = group.employees > 0 ? (group.resigned / group.employees) * 100 : 0;
        const shortageRate = (group.employees + group.shortage) > 0
            ? (group.shortage / (group.employees + group.shortage)) * 100
            : 0;

        stats.push({
            name: town,
            totalEmployees: group.employees,
            shortageCount: group.shortage,
            shortageRate: parseFloat(shortageRate.toFixed(1)),
            topIndustry: topIndustry,
            turnoverRate: parseFloat(turnoverRate.toFixed(1)),
            companyCount: group.companies.length,
            talentStructure: group.talent
        });
    });

    return stats.sort((a, b) => b.totalEmployees - a.totalEmployees);
}

// ===== Industry Stats (Phase 4) =====
export interface IndustryStat {
    name: string;
    totalEmployees: number;
    shortageCount: number;
    shortageRate: number;
    topTown: string;
    turnoverRate: number;
    companyCount: number;
    avgEmployeesPerCompany: number;
    talentStructure: {
        general: number;
        tech: number;
        mgmt: number;
    };
}

export async function getIndustryStats(filters?: { town?: string }): Promise<IndustryStat[]> {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return [];

    // Latest month snapshot
    filteredData.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = filteredData[0].report_month;
    const currentData = filteredData.filter(d => d.report_month === latestMonth);

    // Group by Industry
    const industryGroups = new Map<string, {
        employees: number;
        shortage: number;
        recruited: number;
        resigned: number;
        companies: any[];
        talent: { general: number; tech: number; mgmt: number; };
    }>();

    currentData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const industry = comp?.industry || '其他';

        if (!industryGroups.has(industry)) {
            industryGroups.set(industry, {
                employees: 0,
                shortage: 0,
                recruited: 0,
                resigned: 0,
                companies: [],
                talent: { general: 0, tech: 0, mgmt: 0 }
            });
        }

        const group = industryGroups.get(industry)!;
        group.employees += (row.employees_total || 0);
        group.shortage += (row.shortage_total || 0);
        group.recruited += (row.recruited_new || 0);
        group.resigned += (row.resigned_total || 0);

        // Aggregate talent structure
        const detail = typeof row.shortage_detail === 'string'
            ? JSON.parse(row.shortage_detail)
            : (row.shortage_detail || {});

        group.talent.general += detail.general || 0;
        group.talent.tech += detail.tech || 0;
        group.talent.mgmt += detail.mgmt || 0;

        group.companies.push(row);
    });

    const stats: IndustryStat[] = [];

    industryGroups.forEach((group, industry) => {
        if (industry === '未知') return;

        // Find Top Town in this industry
        const townCounts = new Map<string, number>();
        group.companies.forEach(row => {
            const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
            const town = comp?.town || '未知';
            townCounts.set(town, (townCounts.get(town) || 0) + (row.employees_total || 0));
        });

        const topTown = Array.from(townCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '综合';

        const turnoverRate = group.employees > 0 ? (group.resigned / group.employees) * 100 : 0;
        const shortageRate = (group.employees + group.shortage) > 0
            ? (group.shortage / (group.employees + group.shortage)) * 100
            : 0;
        const avgEmployees = group.companies.length > 0 ? group.employees / group.companies.length : 0;

        stats.push({
            name: industry,
            totalEmployees: group.employees,
            shortageCount: group.shortage,
            shortageRate: parseFloat(shortageRate.toFixed(2)),
            topTown: topTown,
            turnoverRate: parseFloat(turnoverRate.toFixed(2)),
            companyCount: group.companies.length,
            avgEmployeesPerCompany: parseFloat(avgEmployees.toFixed(0)),
            talentStructure: group.talent
        });
    });

    return stats.sort((a, b) => b.totalEmployees - a.totalEmployees);
}

// ===== Industry Detail (Phase 4 - Modal) =====
export interface IndustryMonthlyPoint {
    month: string;       // e.g. "2025-01"
    monthLabel: string;  // e.g. "1月"
    employees: number;
    recruited: number;
    resigned: number;
    shortage: number;
}

export interface IndustryTopCompany {
    name: string;
    avgEmployees: number;
    totalRecruited: number;
    totalResigned: number;
    currentShortage: number;
    talentStructure: {
        general: number;
        tech: number;
        mgmt: number;
    };
}

export interface IndustryTownDistribution {
    town: string;
    avgEmployees: number;
}

export interface IndustryDetailResponse {
    name: string;
    companyCount: number;
    avgMonthlyEmployees: number;
    yearGrowthRate: number;  // %
    totalRecruited: number;
    totalResigned: number;
    netGrowth: number;
    monthlyTrend: IndustryMonthlyPoint[];
    topCompanies: IndustryTopCompany[];
    townDistribution: IndustryTownDistribution[];
    talentStructure: {
        general: number;
        tech: number;
        mgmt: number;
    };
}

export async function getIndustryDetail(industryName: string): Promise<IndustryDetailResponse> {
    const allData = await fetchAllRawData();

    // Filter to this industry only
    const industryData = allData.filter((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        return comp?.industry === industryName;
    });

    if (industryData.length === 0) {
        return {
            name: industryName, companyCount: 0, avgMonthlyEmployees: 0,
            yearGrowthRate: 0, totalRecruited: 0, totalResigned: 0, netGrowth: 0,
            monthlyTrend: [], topCompanies: [], townDistribution: [],
            talentStructure: { general: 0, tech: 0, mgmt: 0 }
        };
    }

    // Group by month
    const monthMap = new Map<string, { employees: number; recruited: number; resigned: number; shortage: number }>();
    const companyMonthlyData = new Map<string, { months: number; totalEmployees: number; totalRecruited: number; totalResigned: number; latestShortage: number }>();
    const townMonthlyData = new Map<string, { months: Set<string>; totalEmployees: number }>();

    // To calculate talent structure, we need the latest record for each company in this industry
    const companyLatestRecordsMap = new Map<string, any>();
    // Sort by date ascending to ensure the map stores the latest record
    industryData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    industryData.forEach((row: any) => {
        const month = row.report_month?.substring(0, 7) || '';
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const compName = comp?.name || '未知';
        const town = comp?.town || '未知';

        // Monthly aggregation
        if (!monthMap.has(month)) {
            monthMap.set(month, { employees: 0, recruited: 0, resigned: 0, shortage: 0 });
        }
        const mData = monthMap.get(month)!;
        mData.employees += (row.employees_total || 0);
        mData.recruited += (row.recruited_new || 0);
        mData.resigned += (row.resigned_total || 0);
        mData.shortage += (row.shortage_total || 0);

        // Company aggregation
        if (!companyMonthlyData.has(compName)) {
            companyMonthlyData.set(compName, { months: 0, totalEmployees: 0, totalRecruited: 0, totalResigned: 0, latestShortage: 0 });
        }
        const cData = companyMonthlyData.get(compName)!;
        cData.months += 1;
        cData.totalEmployees += (row.employees_total || 0);
        cData.totalRecruited += (row.recruited_new || 0);
        cData.totalResigned += (row.resigned_total || 0);
        cData.latestShortage = (row.shortage_total || 0); // Will be latest since data is sorted

        // Town aggregation
        if (town !== '未知') {
            if (!townMonthlyData.has(town)) {
                townMonthlyData.set(town, { months: new Set(), totalEmployees: 0 });
            }
            const tData = townMonthlyData.get(town)!;
            tData.months.add(month);
            tData.totalEmployees += (row.employees_total || 0);
        }

        // Store latest record for each company for talent structure calculation
        companyLatestRecordsMap.set(compName, row);
    });

    // Calculate talent structure from the latest records of companies in this industry
    const talentStructure = { general: 0, tech: 0, mgmt: 0 };
    Array.from(companyLatestRecordsMap.values()).forEach((row: any) => {
        const detail = typeof row.shortage_detail === 'string'
            ? JSON.parse(row.shortage_detail)
            : (row.shortage_detail || {});

        talentStructure.general += detail.general || 0;
        talentStructure.tech += detail.tech || 0;
        talentStructure.mgmt += detail.mgmt || 0;
    });


    // Monthly trend sorted by month
    const monthlyTrend: IndustryMonthlyPoint[] = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
            month,
            monthLabel: parseInt(month.split('-')[1]) + '月',
            ...data,
        }));

    // Only keep latest 12 months for display
    const recentTrend = monthlyTrend.slice(-12);

    // Calculate KPIs
    const totalMonths = monthlyTrend.length;
    const totalEmployeesAllMonths = monthlyTrend.reduce((s, m) => s + m.employees, 0);
    const avgMonthlyEmployees = totalMonths > 0 ? Math.round(totalEmployeesAllMonths / totalMonths) : 0;

    const firstMonth = monthlyTrend[0]?.employees || 0;
    const lastMonth = monthlyTrend[monthlyTrend.length - 1]?.employees || 0;
    const yearGrowthRate = firstMonth > 0 ? parseFloat(((lastMonth - firstMonth) / firstMonth * 100).toFixed(1)) : 0;

    const totalRecruited = monthlyTrend.reduce((s, m) => s + m.recruited, 0);
    const totalResigned = monthlyTrend.reduce((s, m) => s + m.resigned, 0);
    const netGrowth = totalRecruited - totalResigned;

    // Top companies by avg employees
    const topCompanies: IndustryTopCompany[] = Array.from(companyMonthlyData.entries())
        .map(([name, data]) => ({
            name,
            avgEmployees: Math.round(data.totalEmployees / data.months),
            totalRecruited: data.totalRecruited,
            totalResigned: data.totalResigned,
            currentShortage: data.latestShortage,
            talentStructure: (() => {
                const row = companyLatestRecordsMap.get(name);
                const detail = typeof row?.shortage_detail === 'string'
                    ? JSON.parse(row.shortage_detail)
                    : (row?.shortage_detail || {});
                return {
                    general: detail.general || 0,
                    tech: detail.tech || 0,
                    mgmt: detail.mgmt || 0
                };
            })()
        }))
        .sort((a, b) => b.avgEmployees - a.avgEmployees)
        .slice(0, 5);

    // Town distribution
    const townDistribution: IndustryTownDistribution[] = Array.from(townMonthlyData.entries())
        .map(([town, data]) => ({
            town,
            avgEmployees: Math.round(data.totalEmployees / data.months.size),
        }))
        .sort((a, b) => b.avgEmployees - a.avgEmployees)
        .slice(0, 5);

    // Unique companies count
    const companyCount = companyMonthlyData.size;

    return {
        name: industryName,
        companyCount,
        avgMonthlyEmployees,
        yearGrowthRate,
        totalRecruited,
        totalResigned,
        netGrowth,
        monthlyTrend: recentTrend,
        topCompanies,
        townDistribution,
        talentStructure
    };
}

// ===== Town Detail (Phase 4.5 - Town Modal) =====
export interface TownDetailResponse {
    name: string;
    companyCount: number;
    avgMonthlyEmployees: number;
    yearGrowthRate: number;
    totalRecruited: number;
    totalResigned: number;
    netGrowth: number;
    monthlyTrend: IndustryMonthlyPoint[]; // Reuse same point structure
    topCompanies: IndustryTopCompany[];   // Reuse same company structure
    industryDistribution: { industry: string; avgEmployees: number }[];
}

export async function getTownDetail(townName: string): Promise<TownDetailResponse> {
    const allData = await fetchAllRawData();

    // Filter to this town only
    const townData = allData.filter((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        return comp?.town === townName;
    });

    if (townData.length === 0) {
        return {
            name: townName, companyCount: 0, avgMonthlyEmployees: 0,
            yearGrowthRate: 0, totalRecruited: 0, totalResigned: 0, netGrowth: 0,
            monthlyTrend: [], topCompanies: [], industryDistribution: []
        };
    }

    // Group by month
    const monthMap = new Map<string, { employees: number; recruited: number; resigned: number; shortage: number }>();
    const companyMonthlyData = new Map<string, { months: number; totalEmployees: number; totalRecruited: number; totalResigned: number; lastShortage: number }>();
    const industryMonthlyData = new Map<string, { months: Set<string>; totalEmployees: number }>();
    const companyLatestRecordsMap = new Map<string, any>();

    // Sort by date ascending
    townData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    townData.forEach((row: any) => {
        const month = row.report_month?.substring(0, 7) || '';
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const compName = comp?.name || '未知';
        const industry = comp?.industry || '其他';

        // Monthly aggregation
        if (!monthMap.has(month)) {
            monthMap.set(month, { employees: 0, recruited: 0, resigned: 0, shortage: 0 });
        }
        const mData = monthMap.get(month)!;
        mData.employees += (row.employees_total || 0);
        mData.recruited += (row.recruited_new || 0);
        mData.resigned += (row.resigned_total || 0);
        mData.shortage += (row.shortage_total || 0);

        // Company aggregation
        if (!companyMonthlyData.has(compName)) {
            companyMonthlyData.set(compName, { months: 0, totalEmployees: 0, totalRecruited: 0, totalResigned: 0, lastShortage: 0 });
        }
        const cData = companyMonthlyData.get(compName)!;
        cData.months += 1;
        cData.totalEmployees += (row.employees_total || 0);
        cData.totalRecruited += (row.recruited_new || 0);
        cData.totalResigned += (row.resigned_total || 0);
        cData.lastShortage = (row.shortage_total || 0);
        companyLatestRecordsMap.set(compName, row); // Store latest record for each company for talent structure calculation

        // Industry aggregation
        if (!industryMonthlyData.has(industry)) {
            industryMonthlyData.set(industry, { months: new Set(), totalEmployees: 0 });
        }
        const iData = industryMonthlyData.get(industry)!;
        iData.months.add(month);
        iData.totalEmployees += (row.employees_total || 0);
    });

    // Monthly Trend
    const monthlyTrend = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
            month,
            monthLabel: parseInt(month.split('-')[1]) + '月',
            ...data
        }));

    // Only keep latest 12 months for display
    const recentTrend = monthlyTrend.slice(-12);

    // KPIs
    const totalMonths = monthlyTrend.length;
    const totalEmployeesAllMonths = monthlyTrend.reduce((s, m) => s + m.employees, 0);
    const avgMonthlyEmployees = totalMonths > 0 ? Math.round(totalEmployeesAllMonths / totalMonths) : 0;

    const firstMonth = monthlyTrend[0]?.employees || 0;
    const lastMonth = monthlyTrend[monthlyTrend.length - 1]?.employees || 0;
    const yearGrowthRate = firstMonth > 0 ? parseFloat(((lastMonth - firstMonth) / firstMonth * 100).toFixed(1)) : 0;

    const totalRecruited = monthlyTrend.reduce((s, m) => s + m.recruited, 0);
    const totalResigned = monthlyTrend.reduce((s, m) => s + m.resigned, 0);
    const netGrowth = totalRecruited - totalResigned;

    const companyCount = companyMonthlyData.size;

    // Top Companies
    const topCompanies = Array.from(companyMonthlyData.entries())
        .map(([name, data]) => ({
            name,
            avgEmployees: Math.round(data.totalEmployees / data.months),
            totalRecruited: data.totalRecruited,
            totalResigned: data.totalResigned,
            currentShortage: data.lastShortage,
            talentStructure: (() => {
                const row = companyLatestRecordsMap.get(name);
                const detail = typeof row?.shortage_detail === 'string'
                    ? JSON.parse(row.shortage_detail)
                    : (row?.shortage_detail || {});
                return {
                    general: detail.general || 0,
                    tech: detail.tech || 0,
                    mgmt: detail.mgmt || 0
                };
            })()
        }))
        .sort((a, b) => b.avgEmployees - a.avgEmployees)
        .slice(0, 5);

    // Industry Distribution
    const industryDistribution = Array.from(industryMonthlyData.entries())
        .map(([industry, data]) => ({
            industry,
            avgEmployees: Math.round(data.totalEmployees / data.months.size)
        }))
        .sort((a, b) => b.avgEmployees - a.avgEmployees)
        .slice(0, 5);

    return {
        name: townName,
        companyCount,
        avgMonthlyEmployees,
        yearGrowthRate,
        totalRecruited,
        totalResigned: totalResigned,
        netGrowth,
        monthlyTrend: recentTrend,
        topCompanies,
        industryDistribution
    };
}

// Output interface for company history
export interface CompanyHistoryRecord {
    report_month: string;
    employees_total: number;
    recruited_new: number;
    resigned_total: number;
    shortage_total: number;
}

/**
 * Get full history for a specific company
 */
export interface CompanyHistoryResponse {
    info: {
        id: string;
        name: string;
        industry: string;
        town: string;
        contact_person: string | null;
        contact_phone: string | null;
    } | null;
    history: CompanyHistoryRecord[];
}

export async function getCompanyHistory(companyName: string): Promise<CompanyHistoryResponse> {
    // 1. Get Company Info
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, name, industry, town, contact_person, contact_phone')
        .eq('name', companyName)
        .limit(1);

    if (companyError || !companies || companies.length === 0) {
        console.error('Company fetch error:', companyError);
        return { info: null, history: [] };
    }

    const company = companies[0];

    // 2. Get History Records directly
    // Using direct query avoids pagination issues with fetchAllRawData
    const { data: reports, error: reportsError } = await supabase
        .from('monthly_reports')
        .select('*')
        .eq('company_id', company.id)
        .order('report_month', { ascending: true });

    if (reportsError) {
        console.error('Reports fetch error:', reportsError);
        return { info: null, history: [] };
    }

    const companyInfo = {
        id: company.id,
        name: company.name,
        industry: company.industry || '未知',
        town: company.town || '未知',
        contact_person: company.contact_person,
        contact_phone: company.contact_phone
    };

    const history = (reports || [])
        .map((row: any) => ({
            report_month: row.report_month,
            employees_total: row.employees_total || 0,
            recruited_new: row.recruited_new || 0,
            resigned_total: row.resigned_total || 0,
            shortage_total: row.shortage_total || 0,
        }))
        // Ensure sorted by date just in case
        .sort((a: any, b: any) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    return { info: companyInfo, history };
}

/**
 * Get company basic info for Modal initialization
 * This returns minimal data - the Modal will fetch full history itself
 */
export async function getCompanyInfo(companyName: string) {
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name, industry, town, contact_person, contact_phone')
        .eq('name', companyName)
        .limit(1);

    if (!companies || companies.length === 0) return null;

    return {
        info: companies[0],
        history: [], // Not needed, Modal fetches its own
        stats: undefined // Not needed, Modal calculates its own
    };
}

/**
 * Get year-over-year comparison metrics
 * Calculates annual aggregates and growth rates
 */
export async function getYearOverYearComparison(
    filters?: { industry?: string; town?: string }
): Promise<YearOverYearData> {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Group by year
    const yearlyData = new Map<string, {
        employeeSamples: number[];
        shortageSamples: number[];
        recruited: number;
        resigned: number;
    }>();

    filteredData.forEach((row: any) => {
        const year = row.report_month.substring(0, 4);

        if (!yearlyData.has(year)) {
            yearlyData.set(year, {
                employeeSamples: [],
                shortageSamples: [],
                recruited: 0,
                resigned: 0
            });
        }

        const yearData = yearlyData.get(year)!;
        yearData.employeeSamples.push(row.employees_total || 0);
        yearData.shortageSamples.push(row.shortage_total || 0);
        yearData.recruited += row.recruited_new || 0;
        yearData.resigned += row.resigned_total || 0;
    });

    // Calculate metrics for each year
    const result: YearOverYearData = {};
    const years = Array.from(yearlyData.keys()).sort();

    years.forEach((year, index) => {
        const data = yearlyData.get(year)!;

        // Average employees and shortage across all monthly samples
        const avgEmployees = data.employeeSamples.reduce((sum, val) => sum + val, 0) / data.employeeSamples.length;
        const avgShortage = data.shortageSamples.reduce((sum, val) => sum + val, 0) / data.shortageSamples.length;

        // Calculate growth rate compared to previous year
        let growthRate: number | null = null;
        if (index > 0) {
            const prevYear = years[index - 1];
            const prevAvgEmployees = result[prevYear].avgEmployees;
            if (prevAvgEmployees > 0) {
                growthRate = ((avgEmployees - prevAvgEmployees) / prevAvgEmployees) * 100;
            }
        }

        result[year] = {
            avgEmployees: Math.round(avgEmployees),
            totalRecruited: data.recruited,
            totalResigned: data.resigned,
            avgShortage: Math.round(avgShortage),
            growthRate: growthRate !== null ? Math.round(growthRate * 10) / 10 : null
        };
    });

    return result;
}

// Output interface for getQuarterlyBreakdown
interface QuarterlyData {
    year: string;
    quarter: string;
    employees: number;
    recruited: number;
    resigned: number;
    shortage: number; // Added shortage
}

/**
 * Get quarterly breakdown with shortage data
 */
export async function getQuarterlyBreakdown(
    filters?: { industry?: string; town?: string }
): Promise<QuarterlyData[]> {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    const quarterlyData = new Map<string, {
        employees: number[];
        recruited: number;
        resigned: number;
        shortage: number[]; // Track shortage samples
    }>();

    filteredData.forEach((row: any) => {
        const date = new Date(row.report_month);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        const key = `${year}-Q${quarter}`;

        if (!quarterlyData.has(key)) {
            quarterlyData.set(key, {
                employees: [],
                recruited: 0,
                resigned: 0,
                shortage: []
            });
        }

        const qData = quarterlyData.get(key)!;
        qData.employees.push(row.employees_total || 0);
        qData.shortage.push(row.shortage_total || 0);
        qData.recruited += row.recruited_new || 0;
        qData.resigned += row.resigned_total || 0;
    });

    return Array.from(quarterlyData.entries())
        .map(([key, data]) => {
            const [year, quarter] = key.split('-');
            return {
                year,
                quarter,
                employees: Math.round(data.employees.reduce((sum, val) => sum + val, 0) / (data.employees.length || 1)),
                shortage: Math.round(data.shortage.reduce((sum, val) => sum + val, 0) / (data.shortage.length || 1)),
                recruited: data.recruited,
                resigned: data.resigned
            };
        })
        .sort((a, b) => `${a.year}-${a.quarter}`.localeCompare(`${b.year}-${b.quarter}`));
}

/**
 * Get seasonal (monthly) averages across all years
 * Used for heatmaps and identifying seasonal patterns
 */
export async function getSeasonalStats(
    filters?: { industry?: string; town?: string }
): Promise<Array<{ month: number; avgRecruited: number; avgResigned: number; avgShortage: number; peakMonth?: boolean }>> {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Group by month (1-12) regardless of year
    const monthlyStats = new Map<number, {
        recruited: number[],
        resigned: number[],
        shortage: number[]
    }>();

    // Initialize 1-12
    for (let i = 1; i <= 12; i++) {
        monthlyStats.set(i, { recruited: [], resigned: [], shortage: [] });
    }

    filteredData.forEach((row: any) => {
        const date = new Date(row.report_month);
        const month = date.getMonth() + 1;

        const mData = monthlyStats.get(month)!;
        // We aggregate by summing per month-year first, or just taking raw samples?
        // Since we want "Average Recruited per Month", we should probably take the SUM of all companies for that specific month-year, 
        // and then average those sums across years? 
        // OR simpler: Just average the per-company values? 
        // "Seasonal Pattern" usually implies "Total Market Volume". 
        // So we should sum totals for "2023-01", "2024-01" etc, then average those totals.

        // Let's do it in two passes: 
        // 1. Sum by YYYY-MM
        // 2. Group YYYY-MM sums by MM and average
    });

    // Pass 1: Aggregate by YYYY-MM
    const yearMonthSums = new Map<string, { recruited: number; resigned: number; shortage: number }>();

    filteredData.forEach((row: any) => {
        const key = row.report_month.substring(0, 7); // YYYY-MM
        if (!yearMonthSums.has(key)) {
            yearMonthSums.set(key, { recruited: 0, resigned: 0, shortage: 0 });
        }
        const period = yearMonthSums.get(key)!;
        period.recruited += row.recruited_new || 0;
        period.resigned += row.resigned_total || 0;
        period.shortage += row.shortage_total || 0;
    });

    // Pass 2: Aggregate by Month (1-12)
    const seasonalSums = new Map<number, {
        recruitedSamples: number[],
        resignedSamples: number[],
        shortageSamples: number[]
    }>();

    for (let i = 1; i <= 12; i++) {
        seasonalSums.set(i, { recruitedSamples: [], resignedSamples: [], shortageSamples: [] });
    }

    yearMonthSums.forEach((data, yyyyMm) => {
        const month = parseInt(yyyyMm.split('-')[1]);
        const sData = seasonalSums.get(month)!;
        sData.recruitedSamples.push(data.recruited);
        sData.resignedSamples.push(data.resigned);
        sData.shortageSamples.push(data.shortage);
    });

    // Calculate averages
    return Array.from(seasonalSums.entries()).map(([month, data]) => {
        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return {
            month,
            avgRecruited: avg(data.recruitedSamples),
            avgResigned: avg(data.resignedSamples),
            avgShortage: avg(data.shortageSamples)
        };
    }).sort((a, b) => a.month - b.month);
}

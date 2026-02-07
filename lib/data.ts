import 'server-only'; // Ensure this runs only on server
import { supabaseAdmin as supabase } from './supabase-admin';

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

// Helper to fetch all raw data first (since we filter in memory)
// In a real large DB, we would filter in SQL. But Supabase JS join filtering is tricky with dynamic optional params and pagination.
// Given 3500 rows, fetching all then filtering is reasonably fast and very flexible.
async function fetchAllRawData() {
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
    return allData;
}

export async function getTrendData(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Sort logic needs date objects
    filteredData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    // Aggregate by month
    const monthlyTotals = new Map();

    filteredData.forEach(row => {
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

    const totals = new Map();
    filteredData.forEach((row: any) => {
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
    filteredData.forEach((row: any) => {
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

    // Group by company
    const companyMap = new Map();

    filteredData.forEach((row: any) => {
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

    let cumulative_recruited = 0;
    let cumulative_resigned = 0;
    let net_growth = 0;

    filteredData.forEach(r => {
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

    // Calculate Net Growth based on: Latest Month Total - Earliest Month Total
    // First, verify we have time span
    const sortedDates = [...new Set(filteredData.map(d => d.report_month))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDate = sortedDates[0];
    const startData = filteredData.filter(d => d.report_month === startDate);
    const start_total_employees = startData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);

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

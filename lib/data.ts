import 'server-only'; // Ensure this runs only on server
import { supabaseAdmin as supabase } from './supabase-admin';
import { getPgPool } from './db';
import { cache } from 'react';
import { INDUSTRY_POLICY_ORDER, sortByIndustryPolicy } from './constants';
export { INDUSTRY_POLICY_ORDER, sortByIndustryPolicy };



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

// ===== Dual-mode data fetching =====
// Production (DATABASE_URL set): direct PostgreSQL via pg
// Development (no DATABASE_URL): Supabase SDK

async function _fetchViaPostgres(): Promise<any[]> {
    const pool = getPgPool();
    if (!pool) throw new Error('PG pool not available');

    const result = await pool.query(`
        SELECT
            mr.*,
            json_build_object(
                'name', c.name,
                'industry', c.industry,
                'town', c.town
            ) as companies
        FROM monthly_reports mr
        JOIN companies c ON mr.company_id = c.id
        WHERE mr.status != 'PENDING' OR mr.status IS NULL
        ORDER BY mr.id ASC
    `);
    console.log(`[PG] Fetched ${result.rows.length} records from PostgreSQL`);

    // Normalize Date objects to strings to match Supabase response format
    // Supabase returns 'YYYY-MM-DD' string for DATE columns
    return result.rows.map(row => {
        if (row.report_month instanceof Date) {
            // Adjust for timezone offset if necessary, but usually simple ISO split is enough for DATE types 
            // if we assume they were stored as UTC midnight or we just want the date part.
            // For report_month (DATE type), we want YYYY-MM-DD.
            const d = new Date(row.report_month);
            // This ensures we get the YYYY-MM-DD part. 
            // Note: Date.toISOString() uses UTC. Ensure DB DATE is interpreted correctly.
            // PG 'DATE' is usually just a date. JS Date will be 00:00:00 local or UTC depending on driver.
            // Safe bet for 'YYYY-MM-DD':
            row.report_month = row.report_month.toISOString().split('T')[0];
        }
        // created_at / updated_at are timestamps, Supabase returns ISO strings
        if (row.created_at instanceof Date) row.created_at = row.created_at.toISOString();
        if (row.updated_at instanceof Date) row.updated_at = row.updated_at.toISOString();

        return row;
    });
}

async function _fetchViaSupabase(): Promise<any[]> {
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
            .neq('status', 'PENDING')
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
    console.log(`[Supabase] Fetched ${allData.length} records`);
    return allData;
}

// Core fetcher: auto-selects based on environment
async function _fetchAllRawDataFromDB(): Promise<any[]> {
    try {
        if (process.env.DATABASE_URL) {
            return await _fetchViaPostgres();
        }
        return await _fetchViaSupabase();
    } catch (error) {
        // During Docker build, database is not available - return empty array
        console.warn('[Data] Database not available (build-time?), returning empty data:', (error as Error).message);
        return [];
    }
}

// In-memory cache with 5-minute TTL
let _memoryCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function _cachedFetch(): Promise<any[]> {
    const now = Date.now();
    if (_memoryCache.data && (now - _memoryCache.timestamp) < CACHE_TTL) {
        console.log(`[Cache HIT] ${_memoryCache.data.length} records (age: ${Math.round((now - _memoryCache.timestamp) / 1000)}s)`);
        return _memoryCache.data;
    }
    console.log('[Cache MISS] Fetching from database...');
    const data = await _fetchAllRawDataFromDB();
    _memoryCache = { data, timestamp: now };
    return data;
}

// Per-request deduplication
const fetchAllRawData = cache(_cachedFetch);

export async function getTrendData(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    // Sort logic needs date objects
    filteredData.sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return [];

    const validatedMonth = validMonthInfo.month;
    const targetYear = new Date(validatedMonth).getFullYear().toString();

    // Filter for current year AND only up to the validated month
    const validYearData = filteredData.filter(d =>
        d.report_month.startsWith(targetYear) &&
        new Date(d.report_month).getTime() <= new Date(validatedMonth).getTime()
    );

    // Aggregate by month
    const monthlyTotals = new Map();

    validYearData.forEach(row => {
        const date = new Date(row.report_month);
        const monthKey = `${date.getMonth() + 1}月`;

        if (!monthlyTotals.has(monthKey)) {
            monthlyTotals.set(monthKey, { month: monthKey, total: 0, shortage: 0, newHires: 0, attrition: 0, sortInd: date.getTime() });
        }

        const cur = monthlyTotals.get(monthKey);
        cur.total += row.employees_total || 0;
        cur.shortage += row.shortage_total || 0;
        cur.newHires += row.recruited_new || 0;
        cur.attrition += row.resigned_total || 0;
    });

    return Array.from(monthlyTotals.values())
        .map(({ month, total, shortage, newHires, attrition }) => ({ month, total, shortage, newHires, attrition }));
}

export async function getTopShortageCompanies(limit = 10, filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredGlobal = applyFilters(allData, filters);

    if (filteredGlobal.length === 0) return [];

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredGlobal.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredGlobal, total_enterprises);
    if (!validMonthInfo) return [];

    const latestMonth = validMonthInfo.month;
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

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return [];

    const validatedMonth = validMonthInfo.month;
    const targetYear = new Date(validatedMonth).getFullYear().toString();

    // Filter for current year AND only up to the validated month
    const validYearData = filteredData.filter(d =>
        d.report_month.startsWith(targetYear) &&
        new Date(d.report_month).getTime() <= new Date(validatedMonth).getTime()
    );

    const totals = new Map();
    validYearData.forEach((row: any) => {
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

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return [];

    const validatedMonth = validMonthInfo.month;
    const targetYear = new Date(validatedMonth).getFullYear().toString();

    // Filter for current year AND only up to the validated month
    const validYearData = filteredData.filter(d =>
        d.report_month.startsWith(targetYear) &&
        new Date(d.report_month).getTime() <= new Date(validatedMonth).getTime()
    );

    validYearData.forEach((row: any) => {
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

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return [];

    const validatedMonth = validMonthInfo.month;
    const targetYear = new Date(validatedMonth).getFullYear().toString();

    // Filter for current year AND only up to the validated month
    const validYearData = filteredData.filter(d =>
        d.report_month.startsWith(targetYear) &&
        new Date(d.report_month).getTime() <= new Date(validatedMonth).getTime()
    );

    // Group by company
    const companyMap = new Map();

    validYearData.forEach((row: any) => {
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

// Helper for Threshold-Based Rollout
function getValidatedLatestMonth(allData: any[], filteredData: any[], totalEnterprises: number) {
    if (filteredData.length === 0) return null;

    // Get all unique months in descending order
    const allSortedDates = [...new Set(filteredData.map(d => d.report_month))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (let i = 0; i < allSortedDates.length; i++) {
        const candidateMonth = allSortedDates[i];

        // Count how many distinct enterprises submitted for this candidate month
        const monthData = filteredData.filter(d => d.report_month === candidateMonth);
        const submittedCount = new Set(monthData.map(d => d.company_id)).size;

        // If we have no historical total expected, just return the candidate
        if (totalEnterprises === 0) return { month: candidateMonth, rate: 1, isFallback: false };

        const rate = submittedCount / totalEnterprises;

        // Threshold = 90%
        if (rate >= 0.90 || i === allSortedDates.length - 1) {
            return {
                month: candidateMonth,
                rate: rate,
                isFallback: i > 0, // True if we skipped the absolute latest month
                skippedMonth: i > 0 ? allSortedDates[0] : null,
                latestMonthRate: i > 0 ? (new Set(filteredData.filter(d => d.report_month === allSortedDates[0]).map(d => d.company_id)).size / totalEnterprises) : rate
            };
        }
    }
    return null;
}

export async function getReportSummary(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return null;

    // Distinct companies count (historical baseline for denominators)
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC: Determine the 'valid' latest month
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return null;

    const validatedMonth = validMonthInfo.month;
    const isFallback = validMonthInfo.isFallback;
    const skippedMonthStr = validMonthInfo.skippedMonth ? `${new Date(validMonthInfo.skippedMonth).getMonth() + 1}月` : null;
    const latestMonthRatePct = validMonthInfo.latestMonthRate ? Math.round(validMonthInfo.latestMonthRate * 100) : 100;

    // Filter for current year (based on the validated month) for cumulative stats
    const currentYearStr = new Date(validatedMonth).getFullYear().toString();
    const targetYear = currentYearStr;

    const yearData = filteredData.filter(d => d.report_month.startsWith(targetYear));

    let cumulative_recruited = 0;
    let cumulative_resigned = 0;

    yearData.forEach(r => {
        cumulative_recruited += r.recruited_new || 0;
        cumulative_resigned += r.resigned_total || 0;
    });

    // Fetch detailed data for the VALIDATED current month
    const latestData = filteredData.filter(d => d.report_month === validatedMonth);
    const latestMonthParsed = new Date(validatedMonth);
    const latestMonthStr = `${latestMonthParsed.getMonth() + 1}月`;

    const current_total_employees = latestData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);
    const current_total_shortage = latestData.reduce((acc, curr) => acc + (curr.shortage_total || 0), 0);

    // Calculate derived rates
    const turnover_rate = current_total_employees > 0
        ? ((cumulative_resigned / current_total_employees) * 100).toFixed(1) + '%'
        : '0%';

    const shortage_rate = (current_total_employees + current_total_shortage) > 0
        ? ((current_total_shortage / (current_total_employees + current_total_shortage)) * 100).toFixed(1) + '%'
        : '0%';

    // Net Growth & Growth Rate
    const yearSortedDates = [...new Set(yearData.map(d => d.report_month))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDate = yearSortedDates[0];
    const startData = yearData.filter(d => d.report_month === startDate);
    const start_total_employees = startData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);

    const net_growth_diff = current_total_employees - start_total_employees;
    const growthRate = start_total_employees > 0
        ? parseFloat(((net_growth_diff / start_total_employees) * 100).toFixed(1))
        : 0;

    // Top Industries Share ("One Major, Two New, Three Support" vs Total)
    // We categorize all companies in latestData
    const targetIndustries = ["纺织服装", "生物医药化工", "电子信息", "装备制造", "新能源新材料", "农副产品深加工"];
    let topIndustriesEmployees = 0;
    latestData.forEach(r => {
        const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
        const ind = comp?.industry || "";
        if (targetIndustries.some(t => ind.includes(t))) {
            topIndustriesEmployees += (r.employees_total || 0);
        }
    });
    const topIndustriesShare = current_total_employees > 0
        ? parseFloat(((topIndustriesEmployees / current_total_employees) * 100).toFixed(1))
        : 0;

    // Top Towns Share (Top 2 Towns) — now also return town names
    const townMap = new Map<string, number>();
    latestData.forEach(r => {
        const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
        const t = comp?.town || "其他";
        townMap.set(t, (townMap.get(t) || 0) + (r.employees_total || 0));
    });
    const sortedTowns = Array.from(townMap.entries())
        .sort((a, b) => b[1] - a[1]);
    const top2TownsEmployees = sortedTowns
        .slice(0, 2)
        .reduce((sum, [, val]) => sum + val, 0);
    const topTowns = sortedTowns.slice(0, 2).map(([name]) => name);

    const topTownsShare = current_total_employees > 0
        ? parseFloat(((top2TownsEmployees / current_total_employees) * 100).toFixed(1))
        : 0;

    // Industry-level shortage & turnover analysis
    const industryMetrics = new Map<string, { employees: number; shortage: number; resigned: number }>();
    latestData.forEach(r => {
        const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
        const ind = comp?.industry || '其他';
        if (!industryMetrics.has(ind)) {
            industryMetrics.set(ind, { employees: 0, shortage: 0, resigned: 0 });
        }
        const m = industryMetrics.get(ind)!;
        m.employees += (r.employees_total || 0);
        m.shortage += (r.shortage_total || 0);
        m.resigned += (r.resigned_total || 0);
    });

    let topShortageIndustry = '未知';
    let maxShortageRate = 0;
    let topTurnoverIndustry = '未知';
    let maxTurnoverRate = 0;
    let topIndustryName = '未知';
    let topIndustryEmployees = 0;
    industryMetrics.forEach((m, ind) => {
        if (ind === '未知' || ind === '其他') return;
        const sr = (m.employees + m.shortage) > 0 ? m.shortage / (m.employees + m.shortage) * 100 : 0;
        const tr = m.employees > 0 ? m.resigned / m.employees * 100 : 0;
        if (sr > maxShortageRate) { maxShortageRate = sr; topShortageIndustry = ind; }
        if (tr > maxTurnoverRate) { maxTurnoverRate = tr; topTurnoverIndustry = ind; }
        if (m.employees > topIndustryEmployees) { topIndustryEmployees = m.employees; topIndustryName = ind; }
    });

    const topIndustrySharePct = current_total_employees > 0
        ? parseFloat(((topIndustryEmployees / current_total_employees) * 100).toFixed(1))
        : 0;

    // Talent structure: 普工+技工 vs total (from shortage breakdown)
    let totalGeneral = 0, totalTech = 0, totalMgmt = 0;
    latestData.forEach(r => {
        totalGeneral += (r.shortage_general || 0);
        totalTech += (r.shortage_tech || 0);
        totalMgmt += (r.shortage_mgmt || 0);
    });
    const totalTalentDemand = totalGeneral + totalTech + totalMgmt;
    const talentGeneralTechPct = totalTalentDemand > 0
        ? parseFloat((((totalGeneral + totalTech) / totalTalentDemand) * 100).toFixed(0))
        : 0;

    // Industry growth rates (start month vs latest month per industry)
    const industryStartMap = new Map<string, number>();
    const industryEndMap = new Map<string, number>();
    const startMonthData = yearData.filter(d => d.report_month === startDate);
    startMonthData.forEach(r => {
        const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
        const ind = comp?.industry || '其他';
        industryStartMap.set(ind, (industryStartMap.get(ind) || 0) + (r.employees_total || 0));
    });
    latestData.forEach(r => {
        const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
        const ind = comp?.industry || '其他';
        industryEndMap.set(ind, (industryEndMap.get(ind) || 0) + (r.employees_total || 0));
    });
    const industryGrowthRates: { name: string; rate: number }[] = [];
    industryEndMap.forEach((endVal, ind) => {
        if (ind === '未知' || ind === '其他') return;
        const startVal = industryStartMap.get(ind) || 0;
        if (startVal > 0) {
            const rate = parseFloat((((endVal - startVal) / startVal) * 100).toFixed(1));
            industryGrowthRates.push({ name: ind, rate });
        }
    });
    industryGrowthRates.sort((a, b) => b.rate - a.rate);

    // Numeric rates for conclusion logic
    const shortageRateNum = (current_total_employees + current_total_shortage) > 0
        ? parseFloat(((current_total_shortage / (current_total_employees + current_total_shortage)) * 100).toFixed(1))
        : 0;
    const turnoverRateNum = current_total_employees > 0
        ? parseFloat(((cumulative_resigned / current_total_employees) * 100).toFixed(1))
        : 0;

    // Growth trend descriptor
    const growthTrend: 'up' | 'down' | 'stable' = growthRate > 1 ? 'up' : growthRate < -1 ? 'down' : 'stable';

    return {
        total_enterprises,
        avg_employment: current_total_employees,
        start_employment: start_total_employees,
        cumulative_recruited,
        cumulative_resigned,
        net_growth: net_growth_diff,
        growthRate,
        turnover_rate,
        shortage_rate,
        current_total_shortage,
        topIndustriesShare,
        topTownsShare,
        // Data-driven fields
        dataYear: targetYear,
        latestMonthStr,
        topTowns,
        topShortageIndustry,
        topTurnoverIndustry,
        shortageRateNum,
        turnoverRateNum,
        growthTrend,
        topIndustryName,
        topIndustrySharePct,
        talentGeneralTechPct,
        industryGrowthRates,
        // Fallback Indicators
        isFallback,
        skippedMonthStr,
        latestMonthRatePct
    };
}

export async function getIndustryDistribution(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    // For Industry Distribution, if we select "Textile", we technically check "Is Textile Distribution within Textile?" -> It's 100%. 
    // But maybe we select Town, then we see Industry Dist within that Town. 
    // So yes, apply filters.
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return [];

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return [];

    const latestMonth = validMonthInfo.month;
    const currentData = filteredData.filter(d => d.report_month === latestMonth);

    const industryStats = new Map<string, { value: number; shortage: number }>();

    currentData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const industry = comp?.industry || '其他';
        const current = industryStats.get(industry) || { value: 0, shortage: 0 };
        current.value += (row.employees_total || 0);
        current.shortage += (row.shortage_total || 0);
        industryStats.set(industry, current);
    });

    // Custom sort order: One Major -> Two New -> Three Support -> Commerce -> Other
    const sortOrder = [
        '纺织服装',          // One Major
        '生物医药化工',      // Two New
        '电子信息',          // Two New
        '装备制造',          // Three Support
        '新能源新材料',      // Three Support
        '农副产品深加工',    // Three Support
        '商贸物流',          // Commerce
        '其他'
    ];

    const getRank = (name: string) => {
        const idx = sortOrder.findIndex(key => name === key || name.includes(key));
        return idx !== -1 ? idx : 99;
    };

    return Array.from(industryStats.entries())
        .map(([name, stats]) => ({ name, value: stats.value, shortage: stats.shortage }))
        .sort((a, b) => {
            const rankA = getRank(a.name);
            const rankB = getRank(b.name);
            if (rankA !== rankB) return rankA - rankB;
            return b.value - a.value; // Tie-break by value
        });
}

export async function getRegionalDistribution(filters?: { industry?: string, town?: string }) {
    const allData = await fetchAllRawData();
    const filteredData = applyFilters(allData, filters);

    if (filteredData.length === 0) return [];

    // Distinct companies count
    const uniqueCompanyIds = new Set(filteredData.map(d => d.company_id));
    const total_enterprises = uniqueCompanyIds.size;

    // THRESHOLD LOGIC
    const validMonthInfo = getValidatedLatestMonth(allData, filteredData, total_enterprises);
    if (!validMonthInfo) return [];

    const latestMonth = validMonthInfo.month;
    const currentData = filteredData.filter(d => d.report_month === latestMonth);

    const townTotals = new Map<string, { value: number; shortage: number }>();

    currentData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const town = comp?.town || '未知';
        const current = townTotals.get(town) || { value: 0, shortage: 0 };
        current.value += (row.employees_total || 0);
        current.shortage += (row.shortage_total || 0);
        townTotals.set(town, current);
    });

    // Aggregate Top 10 towns, rest into "其他乡镇"
    const sortedAllTowns = Array.from(townTotals.entries())
        .map(([name, stats]) => ({ name, value: stats.value, shortage: stats.shortage }))
        .sort((a, b) => b.value - a.value);

    const top10 = sortedAllTowns.slice(0, 10);
    const others = sortedAllTowns.slice(10);

    const result = [...top10];

    if (others.length > 0) {
        const otherTotal = others.reduce((sum, item) => sum + item.value, 0);
        const otherShortage = others.reduce((sum, item) => sum + item.shortage, 0);
        result.push({ name: '其他乡镇', value: otherTotal, shortage: otherShortage });
    }

    return result;
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

    // Aggregate Top 10 towns, rest into "其他乡镇"
    const allTownStats = Array.from(townGroups.entries()).map(([name, group]) => {
        // Find Top Industry
        const indCounts = new Map<string, number>();
        group.companies.forEach(row => {
            const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
            const ind = comp?.industry || '其他';
            indCounts.set(ind, (indCounts.get(ind) || 0) + (row.employees_total || 0));
        });
        const topIndustry = Array.from(indCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '综合';

        return {
            name,
            totalEmployees: group.employees,
            shortageCount: group.shortage,
            recruitedCount: group.recruited,
            resignedCount: group.resigned,
            topIndustry,
            shortageRate: group.employees > 0 ? parseFloat(((group.shortage / group.employees) * 100).toFixed(1)) : 0,
            turnoverRate: group.employees > 0 ? parseFloat(((group.resigned / group.employees) * 100).toFixed(1)) : 0,
            companyCount: group.companies.length,
            talentStructure: group.talent
        };
    }).sort((a, b) => b.totalEmployees - a.totalEmployees);

    const top10 = allTownStats.slice(0, 10);
    const others = allTownStats.slice(10);

    const result = [...top10];

    if (others.length > 0) {
        // Aggregate others
        const otherGroup = {
            name: '其他乡镇',
            totalEmployees: 0,
            shortageCount: 0,
            recruitedCount: 0,
            resignedCount: 0,
            companyCount: 0,
            talentStructure: { general: 0, tech: 0, mgmt: 0 }
        };

        others.forEach(o => {
            otherGroup.totalEmployees += o.totalEmployees;
            otherGroup.shortageCount += o.shortageCount;
            otherGroup.recruitedCount += o.recruitedCount;
            otherGroup.resignedCount += o.resignedCount;
            otherGroup.companyCount += o.companyCount;
            otherGroup.talentStructure.general += o.talentStructure.general;
            otherGroup.talentStructure.tech += o.talentStructure.tech;
            otherGroup.talentStructure.mgmt += o.talentStructure.mgmt;
        });

        result.push({
            ...otherGroup,
            topIndustry: '混合',
            shortageRate: otherGroup.totalEmployees > 0 ? parseFloat(((otherGroup.shortageCount / otherGroup.totalEmployees) * 100).toFixed(1)) : 0,
            turnoverRate: otherGroup.totalEmployees > 0 ? parseFloat(((otherGroup.resignedCount / otherGroup.totalEmployees) * 100).toFixed(1)) : 0,
        } as any);
    }

    return result;
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

    return sortByIndustryPolicy(stats);
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

    let townData: any[];

    if (townName === '其他乡镇') {
        // Special case: aggregate all towns NOT in top 10
        // First, find the top 10 towns by total employees
        const townTotals = new Map<string, number>();
        allData.forEach((row: any) => {
            const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
            const town = comp?.town || '未知';
            townTotals.set(town, (townTotals.get(town) || 0) + (row.employees_total || 0));
        });
        const top10Towns = new Set(
            Array.from(townTotals.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name]) => name)
        );
        // Filter to all towns NOT in top 10
        townData = allData.filter((row: any) => {
            const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
            const town = comp?.town || '未知';
            return !top10Towns.has(town);
        });
    } else {
        // Normal case: filter to specific town
        townData = allData.filter((row: any) => {
            const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
            return comp?.town === townName;
        });
    }

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


// Helper for PG fetch
async function _fetchCompanyHistoryViaPostgres(companyName: string): Promise<CompanyHistoryResponse> {
    const pool = getPgPool();
    if (!pool) throw new Error('PG pool not available');

    // 1. Get Company Info
    const companyRes = await pool.query(
        'SELECT id, name, industry, town, contact_person, contact_phone FROM companies WHERE name = $1 LIMIT 1',
        [companyName]
    );

    if (companyRes.rows.length === 0) {
        return { info: null, history: [] };
    }

    const company = companyRes.rows[0];

    // 2. Get History Records
    const reportsRes = await pool.query(
        'SELECT * FROM monthly_reports WHERE company_id = $1 ORDER BY report_month ASC',
        [company.id]
    );

    // Normalize Dates
    const history = reportsRes.rows.map(row => {
        let report_month = row.report_month;
        if (report_month instanceof Date) {
            report_month = report_month.toISOString().split('T')[0];
        }
        return {
            report_month,
            employees_total: row.employees_total || 0,
            recruited_new: row.recruited_new || 0,
            resigned_total: row.resigned_total || 0,
            shortage_total: row.shortage_total || 0,
        };
    });

    return {
        info: {
            id: company.id,
            name: company.name,
            industry: company.industry || '未知',
            town: company.town || '未知',
            contact_person: company.contact_person,
            contact_phone: company.contact_phone
        },
        history
    };
}

export async function getCompanyHistory(companyName: string): Promise<CompanyHistoryResponse> {
    console.log(`[getCompanyHistory] Called for: "${companyName}"`);

    // Try PostgreSQL first if configured
    if (process.env.DATABASE_URL) {
        console.log('[getCompanyHistory] Using PostgreSQL connection');
        try {
            const result = await _fetchCompanyHistoryViaPostgres(companyName);
            console.log(`[getCompanyHistory] PG Result - Info: ${!!result.info}, History: ${result.history.length}`);
            return result;
        } catch (error) {
            console.error('[getCompanyHistory] PG Error:', error);
            // Fallback to Supabase? Usually if DATABASE_URL is set we don't want fallback unless strictly configured.
            // But let's assume if PG fails we might want to try Supabase if configured.
            // For now, let's stick to the pattern: if URL set, use PG.
            return { info: null, history: [] };
        }
    } else {
        console.warn('[getCompanyHistory] DATABASE_URL not set, falling back to Supabase');
    }

    // Fallback to Supabase SDK matching original logic
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

// ============================================================================
// REPORT GENERATION FUNCTIONS (Phase 5 - Official Report)
// ============================================================================

export async function getDetailedIndustryAnalysis() {
    const allData = await fetchAllRawData();

    // 1. Define Categories and Mappings
    const CATEGORIES: Record<string, string[]> = {
        "一主": ["纺织服装"],
        "两新": ["生物医药化工", "电子信息"],
        "三支撑": ["装备制造", "新能源新材料", "农副产品深加工"]
    };

    // Helper to find category
    const getCategory = (industryName: string) => {
        if (!industryName) return "其他";
        for (const [cat, industries] of Object.entries(CATEGORIES)) {
            if (industries.some(ind => industryName.includes(ind))) return cat;
        }
        return "其他";
    };

    // 2. Group data by Industry (Normalized)
    const targetIndustries = [
        "纺织服装",
        "生物医药化工", "电子信息",
        "装备制造", "新能源新材料", "农副产品深加工"
    ];

    const industryGroups = new Map<string, any[]>();

    // Normalize industry names from DB
    const normalizeIndustry = (name: string) => {
        if (!name) return "其他";
        for (const target of targetIndustries) {
            if (name.includes(target)) return target;
        }
        return "其他";
    };

    allData.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const rawIndustry = comp?.industry || "其他";
        const normalized = normalizeIndustry(rawIndustry);

        if (!industryGroups.has(normalized)) {
            industryGroups.set(normalized, []);
        }
        industryGroups.get(normalized)!.push(row);
    });

    // 3. Aggregate Metrics for each Industry Group
    const result = targetIndustries.map(name => {
        const rows = industryGroups.get(name) || [];
        if (rows.length === 0) return null;

        // Category
        const category = getCategory(name);

        // Unique Companies
        const companies = new Set(rows.map((r: any) => r.company_id));
        const companyCount = companies.size;

        // Monthly Trends (Sum of employees per month)
        // Group rows by month
        const monthMap = new Map<string, number>();
        rows.forEach((r: any) => {
            monthMap.set(r.report_month, (monthMap.get(r.report_month) || 0) + (r.employees_total || 0));
        });

        // Sort months and take last 12
        const sortedMonths = Array.from(monthMap.keys()).sort();
        const last12Months = sortedMonths.slice(-12);
        const monthlyEmployees = last12Months.map(m => monthMap.get(m) || 0);

        // Calculate Average Employees (of the monthly totals)
        const avgEmployees = Math.round(monthlyEmployees.reduce((a, b) => a + b, 0) / (monthlyEmployees.length || 1));

        // Growth Rate (Last month vs First month of period)
        const firstMonthVal = monthlyEmployees[0] || 0;
        const lastMonthVal = monthlyEmployees[monthlyEmployees.length - 1] || 0;
        const netGrowth = lastMonthVal - firstMonthVal;
        const growthRate = firstMonthVal > 0 ? parseFloat(((netGrowth / firstMonthVal) * 100).toFixed(1)) : 0;

        // Total New Hires and Vacancy (Latest)
        // Detect latest available year from the data
        const uniqueMonths = Array.from(new Set(rows.map((r: any) => r.report_month))).sort();
        const latestDateStr = uniqueMonths[uniqueMonths.length - 1] || "";
        const targetYear = latestDateStr.substring(0, 4) || new Date().getFullYear().toString();

        const yearRows = rows.filter((r: any) => r.report_month.startsWith(targetYear));
        const totalNewHires = yearRows.reduce((sum: number, r: any) => sum + (r.recruited_new || 0), 0);

        // Detailed latest data for Top Companies
        const latestDate = sortedMonths[sortedMonths.length - 1];
        const latestRows = rows.filter((r: any) => r.report_month === latestDate);
        const totalVacancy = latestRows.reduce((sum: number, r: any) => sum + (r.shortage_total || 0), 0);

        // Top 5 Companies by dimensions
        const topCompanies = latestRows
            .sort((a: any, b: any) => (b.employees_total || 0) - (a.employees_total || 0))
            .slice(0, 5)
            .map((r: any) => {
                const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
                const compId = r.company_id;
                const compYearRows = yearRows.filter((yr: any) => yr.company_id === compId);
                const compNewHires = compYearRows.reduce((sum: number, x: any) => sum + (x.recruited_new || 0), 0);
                const compAttrition = compYearRows.reduce((sum: number, x: any) => sum + (x.resigned_total || 0), 0);

                return {
                    name: comp?.name || "未知",
                    avgEmployees: r.employees_total || 0, // Current employees
                    newHires: compNewHires,
                    attrition: compAttrition,
                    vacancy: r.shortage_total || 0
                };
            });

        // Top Towns distribution for this industry
        const townMap = new Map<string, number>();
        latestRows.forEach((r: any) => {
            const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
            const t = comp?.town || "其他";
            townMap.set(t, (townMap.get(t) || 0) + (r.employees_total || 0));
        });
        const topTowns = Array.from(townMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, employees]) => ({ name, employees }));

        return {
            category,
            name,
            companyCount,
            avgEmployees,
            growthRate,
            totalNewHires,
            netGrowth,
            totalVacancy,
            monthlyEmployees, // Array of numbers
            topCompanies,
            topTowns
        };
    }).filter(Boolean); // Remove nulls (if no data for an industry)

    return result as any[];
}

export async function getTownDetailedAnalysis() {
    const allData = await fetchAllRawData();

    // Group by Town
    const townGroups = new Map<string, any[]>();

    // Get latest data only for snapshot
    const sortedData = [...allData].sort((a, b) => new Date(a.report_month).getTime() - new Date(b.report_month).getTime());
    const companyLatestMap = new Map();
    sortedData.forEach((row: any) => companyLatestMap.set(row.company_id, row));
    const latestRows = Array.from(companyLatestMap.values());

    latestRows.forEach((row: any) => {
        const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
        const town = comp?.town || "其他";
        if (!townGroups.has(town)) townGroups.set(town, []);
        townGroups.get(town)!.push(row);
    });

    const totalEmployeesCity = latestRows.reduce((sum: number, r: any) => sum + (r.employees_total || 0), 0);

    // Calculate metrics for all towns first
    const allTownStats = Array.from(townGroups.entries()).map(([name, rows]) => {
        const companies = rows.length;
        const employees = rows.reduce((sum: number, r: any) => sum + (r.employees_total || 0), 0);
        return { name, companies, employees, rows };  // Keep rows for aggregation
    }).sort((a, b) => b.employees - a.employees);

    // Top 10 + Other
    const top10 = allTownStats.slice(0, 10);
    const others = allTownStats.slice(10);

    const finalResult = top10.map(item => ({
        name: item.name,
        companies: item.companies,
        employees: item.employees,
        percentage: totalEmployeesCity > 0 ? parseFloat(((item.employees / totalEmployeesCity) * 100).toFixed(1)) : 0
    }));

    if (others.length > 0) {
        const otherEmployees = others.reduce((sum, item) => sum + item.employees, 0);
        const otherCompanies = others.reduce((sum, item) => sum + item.companies, 0);
        const otherPercentage = totalEmployeesCity > 0 ? parseFloat(((otherEmployees / totalEmployeesCity) * 100).toFixed(1)) : 0;

        finalResult.push({
            name: '其他乡镇',
            companies: otherCompanies,
            employees: otherEmployees,
            percentage: otherPercentage
        });
    }

    // No need to sort again, top 10 already sorted, others pushed to end
    return finalResult;
}
export async function getTalentAnalysis() {
    const allData = await fetchAllRawData();
    if (allData.length === 0) return [];

    // Latest month snapshot
    allData.sort((a, b) => new Date(b.report_month).getTime() - new Date(a.report_month).getTime());
    const latestMonth = allData[0].report_month;
    const currentData = allData.filter(d => d.report_month === latestMonth);

    const typeCounts = new Map<string, number>();

    currentData.forEach((row: any) => {
        const detail = typeof row.shortage_detail === 'string'
            ? JSON.parse(row.shortage_detail)
            : (row.shortage_detail || {});

        // Map keys to readable names
        // Assuming keys are "general", "tech", "mgmt", "sales" etc.
        // Or if they are already Chinese, use directly.
        // Based on other code, keys seem to be "general", "tech", "mgmt"
        const MAPPING: Record<string, string> = {
            "general": "普工",
            "tech": "技工",
            "mgmt": "管理/销售",
            "sales": "管理/销售",
            "other": "其他"
        };

        Object.entries(detail).forEach(([key, val]) => {
            const count = Number(val) || 0;
            if (count > 0) {
                const name = MAPPING[key] || key;
                typeCounts.set(name, (typeCounts.get(name) || 0) + count);
            }
        });
    });

    const total = Array.from(typeCounts.values()).reduce((a, b) => a + b, 0);

    return Array.from(typeCounts.entries())
        .map(([type, count]) => ({
            type,
            count,
            percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.count - a.count);
}

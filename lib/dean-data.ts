
import { getPgPool } from './db';
import { supabaseAdmin } from './supabase-admin';

// Types for Dean's Report
export interface SkillGap {
    industry: string;
    totalShortage: number;
    techShortage: number;
    generalShortage: number;
    mgmtShortage: number;
    techRatio: number; // %
}

export interface UpskillingPotential {
    industry: string;
    totalEmployed: number; // Total stock
    generalLaborStock: number; // Potential target for upskilling
    generalRatio: number; // %
    growthRate: number; // % (year-over-year)
}

export interface TargetEnterprise {
    name: string;
    industry: string;
    totalShortage: number;
    techShortage: number;
    tags: string[]; // e.g., "High Tech Demand", "Rapid Growth"
}

// Helper to fetch raw data (reusing logic from data.ts but optimized for these metrics)
async function fetchRawData() {
    const pool = getPgPool();
    let rows: any[] = [];

    // console.log('[DeanData] Fetching raw data...');

    if (pool) {
        // PG Path
        try {
            // console.log('[DeanData] Using PG Pool');
            const res = await pool.query(`
                SELECT 
                    mr.*, 
                    c.name as company_name, 
                    c.industry as company_industry, 
                    c.town as company_town
                FROM monthly_reports mr
                JOIN companies c ON mr.company_id = c.id
            `);
            rows = res.rows;
        } catch (e) {
            console.error('[DeanData] PG Error:', e);
            return [];
        }
    } else {
        // Supabase Path
        // console.log('[DeanData] Using Supabase SDK');
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabaseAdmin
                .from('monthly_reports')
                .select(`*, companies(name, industry, town)`)
                .range(from, to);

            if (error) {
                console.error('[DeanData] Supabase Error', error);
                hasMore = false;
            } else {
                if (data && data.length > 0) {
                    allData = allData.concat(data);
                    hasMore = data.length === PAGE_SIZE;
                    page++;
                } else {
                    hasMore = false;
                }
            }
        }

        rows = allData.map(d => ({
            ...d,
            company_name: d.companies?.name,
            company_industry: d.companies?.industry,
            company_town: d.companies?.town
        }));
    }

    // Normalize numeric fields
    rows = rows.map(r => ({
        ...r,
        employees_total: Number(r.employees_total) || 0,
        shortage_total: Number(r.shortage_total) || 0,
        shortage_tech: Number(r.shortage_tech) || 0,
        shortage_general: Number(r.shortage_general) || 0,
        shortage_mgmt: Number(r.shortage_mgmt) || 0,
        resigned_total: Number(r.resigned_total) || 0,
        recruited_new: Number(r.recruited_new) || 0,
    }));

    if (rows.length === 0) return [];

    // Sort by report_month desc to find latest
    rows.sort((a, b) => {
        const dateA = new Date(a.report_month).getTime();
        const dateB = new Date(b.report_month).getTime();
        return dateB - dateA;
    });

    const latestMonthObj = rows[0].report_month;
    // Normalize latestMonth comparison string
    // If it's a Date object, toISOString().split('T')[0]
    // If string, assume YYYY-MM-DD
    const getYMD = (d: any) => d instanceof Date ? d.toISOString().split('T')[0] : d;

    const latestMonthStr = getYMD(latestMonthObj);

    return rows.filter(r => getYMD(r.report_month) === latestMonthStr);
}

export async function getSkillGapAnalysis(): Promise<SkillGap[]> {
    const data = await fetchRawData();
    const industryMap = new Map<string, SkillGap>();

    data.forEach(row => {
        const ind = row.company_industry || '其他';
        if (!industryMap.has(ind)) {
            industryMap.set(ind, {
                industry: ind,
                totalShortage: 0,
                techShortage: 0,
                generalShortage: 0,
                mgmtShortage: 0,
                techRatio: 0
            });
        }
        const current = industryMap.get(ind)!;
        current.totalShortage += row.shortage_total;
        current.techShortage += row.shortage_tech;
        current.generalShortage += row.shortage_general;
        current.mgmtShortage += row.shortage_mgmt;
    });

    return Array.from(industryMap.values())
        .map(i => ({
            ...i,
            techRatio: i.totalShortage > 0 ? parseFloat(((i.techShortage / i.totalShortage) * 100).toFixed(1)) : 0
        }))
        .filter(i => i.totalShortage > 50) // Filter out small noise
        .sort((a, b) => b.techShortage - a.techShortage);
}

export async function getUpskillingPotential(): Promise<UpskillingPotential[]> {
    const data = await fetchRawData(); // This is latest month data
    const industryMap = new Map<string, UpskillingPotential>();

    data.forEach(row => {
        const ind = row.company_industry || '其他';
        if (!industryMap.has(ind)) {
            industryMap.set(ind, {
                industry: ind,
                totalEmployed: 0,
                generalLaborStock: 0,
                generalRatio: 0,
                growthRate: 0
            });
        }
        const current = industryMap.get(ind)!;
        current.totalEmployed += row.employees_total;

        // Estimate "General Labor Stock" using the logic:
        // Total Employees * (Shortage General / Total Shortage)
        // This assumes the shortage structure is somewhat representative, 
        // OR we can just use Total Employees as the "Pool" for now since all employees might need upskilling.
        // Let's use Total Employees as the base, but highlight industries with high Tech Shortage 
        // because that means they NEED to upskill their current general staff.

        current.generalLaborStock += row.employees_total;
    });

    return Array.from(industryMap.values())
        .map(i => ({
            ...i,
            generalRatio: 100 // Placeholder
        }))
        .sort((a, b) => b.totalEmployed - a.totalEmployed)
        .slice(0, 8);
}

export async function getTargetEnterprises(): Promise<TargetEnterprise[]> {
    const data = await fetchRawData();

    return data
        .map(row => {
            const tech = row.shortage_tech;
            const total = row.shortage_total;
            const tags = [];

            if (tech > 30) tags.push("急需技工");
            if (total > 100) tags.push("用工大户");
            if (total > 0 && (tech / total) > 0.4) tags.push("技术密集需求");

            return {
                name: row.company_name || '未知企业',
                industry: row.company_industry || '其他',
                totalShortage: total,
                techShortage: tech,
                tags
            };
        })
        .filter(e => e.totalShortage > 20) // Minimum threshold
        .sort((a, b) => b.techShortage - a.techShortage) // Prioritize Tech Need
        .slice(0, 10);
}

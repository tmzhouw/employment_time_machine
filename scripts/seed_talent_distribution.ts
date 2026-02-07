
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ratios by industry
const INDUSTRY_RATIOS: Record<string, [number, number, number]> = {
    '纺织服装': [0.80, 0.15, 0.05],
    '装备制造': [0.50, 0.40, 0.10],
    '新能源新材料': [0.60, 0.30, 0.10],
    '电子信息': [0.40, 0.40, 0.20],
    '农副产品加工': [0.85, 0.10, 0.05],
    'default': [0.70, 0.20, 0.10]
};

async function seedTalent() {
    console.log('🚀 Starting talent distribution seeding...');

    // 1. Fetch ALL reports with shortage > 0 using pagination
    const PAGE_SIZE = 1000;
    let allReports: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from('monthly_reports')
            .select(`
                id, 
                shortage_total, 
                companies (industry)
            `)
            .gt('shortage_total', 0)
            .range(from, to);

        if (error) {
            console.error('Error fetching reports:', error);
            break;
        }

        if (data && data.length > 0) {
            allReports = allReports.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
        } else {
            hasMore = false;
        }
    }

    console.log(`Found ${allReports.length} reports with shortage.`);

    let updatedCount = 0;

    // 2. Process each report
    for (const report of allReports) {
        const total = report.shortage_total;
        const industry = report.companies?.industry || 'default';
        const ratios = INDUSTRY_RATIOS[industry] || INDUSTRY_RATIOS['default'];

        // Calculate breakdown
        let general = Math.floor(total * ratios[0]);
        let tech = Math.floor(total * ratios[1]);
        let mgmt = total - general - tech; // Remainder to mgmt to ensure sum matches

        // Handle edge cases where mgmt < 0 (shouldn't happen with these ratios but just in case)
        if (mgmt < 0) {
            mgmt = 0;
            tech = total - general;
        }

        const detail = {
            general: general, // 普工
            tech: tech,       // 技工
            mgmt: mgmt        // 管理销售
        };

        // 3. Update DB
        const { error: updateError } = await supabase
            .from('monthly_reports')
            .update({ shortage_detail: detail })
            .eq('id', report.id);

        if (updateError) {
            console.error(`Failed to update report ${report.id}:`, updateError);
        } else {
            updatedCount++;
        }

        if (updatedCount % 100 === 0) process.stdout.write('.');
    }

    console.log(`\n✅ Updated ${updatedCount} records with talent breakdown.`);
}

seedTalent();


import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDataLogic() {
    console.log('🚀 Debugging Data Logic independently...');

    // 1. Fetch Data (Mimic fetchAllRawData)
    const { data: allData, error } = await supabase
        .from('monthly_reports')
        .select(`
            *,
            companies (name, industry, town)
        `)
        .order('id', { ascending: true })
        .limit(1000); // Limit for test

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log(`Fetched ${allData.length} rows.`);

    // 4. Mimic getIndustryStats Logic
    const industryStats = new Map();

    const currentData = allData.filter(d => d.report_month === '2025-01-31'); // Assume latest month

    // Check if we have data for latest month
    if (currentData.length === 0) {
        console.warn('⚠️ No data for 2025-01-31, using all data for test');
    }

    // For simplicity, iterate ALL data to find shortage
    let totalGeneral = 0;

    allData.forEach((row: any) => {
        if (row.shortage_total > 0) {
            const detail = typeof row.shortage_detail === 'string'
                ? JSON.parse(row.shortage_detail)
                : (row.shortage_detail || {});

            const g = detail.general || 0;
            totalGeneral += g;

            if (g === 0 && row.shortage_total > 0) {
                // Log one failure
                console.log('Parsing failed for row:', row.id, 'detail:', row.shortage_detail, 'type:', typeof row.shortage_detail);
            }
        }
    });

    console.log('Calculated Total General Shortage:', totalGeneral);

    if (totalGeneral > 0) {
        console.log('✅ Logic works! The issue is likely Next.js Caching.');
    } else {
        console.error('❌ Logic failed! The issue is in how we parse shortage_detail.');
    }
}

debugDataLogic();

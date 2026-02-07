
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHistory() {
    console.log('🚀 Starting historical data seeding...');

    // 1. Fetch all companies
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, name');

    if (companyError || !companies) {
        console.error('❌ Failed to fetch companies:', companyError);
        return;
    }

    console.log(`📊 Found ${companies.length} companies. Analyzing existing data...`);

    // 2. Fetch latest employee count for each company
    const { data: existingReports } = await supabase
        .from('monthly_reports')
        .select('company_id, employees_total, report_month')
        .order('report_month', { ascending: false });

    const companyBaseline = new Map<string, number>();
    if (existingReports) {
        existingReports.forEach((r: any) => {
            if (!companyBaseline.has(r.company_id)) {
                companyBaseline.set(r.company_id, r.employees_total);
            }
        });
    }

    const reports: any[] = [];
    const months = [];

    // Generate months from 2023-01 to 2024-12
    for (let year = 2023; year <= 2024; year++) {
        for (let month = 1; month <= 12; month++) {
            months.push(`${year}-${String(month).padStart(2, '0')}-01`);
        }
    }

    for (const company of companies) {
        // Base employees on current count (or random if missing)
        let baseCount = companyBaseline.get(company.id) || Math.floor(Math.random() * 450) + 50;

        // Reset to start of 2023 (simulate growth/fluctuation over 2 years)
        // Start slightly lower to show some growth trend usually
        let currentEmployees = Math.floor(baseCount * 0.9);

        for (const reportMonth of months) {
            const date = new Date(reportMonth);
            const monthIdx = date.getMonth() + 1; // 1-12

            // Seasonal factors
            let seasonalityRecruit = 1.0;
            let seasonalityResign = 1.0;

            // Post-CNY Recruitment Spike (Feb/Mar)
            if (monthIdx === 2 || monthIdx === 3) {
                seasonalityRecruit = 1.8;
                seasonalityResign = 0.7;
            }
            // Mid-year stability (Jun/Jul)
            if (monthIdx === 6 || monthIdx === 7) {
                seasonalityRecruit = 1.2;
            }
            // End of year turnover (Dec/Jan)
            if (monthIdx === 12 || monthIdx === 1) {
                seasonalityResign = 1.5;
                seasonalityRecruit = 0.4;
            }

            // Generate metrics
            // Monthly turnover ~3-5%
            const baseFlux = Math.max(1, Math.floor(currentEmployees * 0.04));

            const recruited = Math.floor(Math.random() * baseFlux * seasonalityRecruit);
            const resigned = Math.floor(Math.random() * baseFlux * seasonalityResign);

            // Net change
            currentEmployees = currentEmployees + recruited - resigned;
            if (currentEmployees < 0) currentEmployees = 0;

            // Shortage (random but correlated with scale)
            // 0-8% shortage
            const shortage = Math.floor(Math.random() * (currentEmployees * 0.08));

            reports.push({
                company_id: company.id,
                report_month: reportMonth,
                employees_total: currentEmployees,
                recruited_new: recruited,
                resigned_total: resigned,
                shortage_total: shortage,
                created_at: new Date().toISOString()
            });
        }
    }

    // Sort by date
    reports.sort((a, b) => a.report_month.localeCompare(b.report_month));

    console.log(`📦 Prepared ${reports.length} historical records.`);

    // Batch insert
    const BATCH_SIZE = 1000;
    for (let i = 0; i < reports.length; i += BATCH_SIZE) {
        const batch = reports.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from('monthly_reports')
            .upsert(batch, { onConflict: 'company_id,report_month' });

        if (error) {
            console.error(`❌ Batch insert failed (${i} - ${i + BATCH_SIZE}):`, error);
        } else {
            console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(reports.length / BATCH_SIZE)}`);
        }
    }

    console.log('🎉 Historical data seeding complete!');
}

seedHistory().catch(console.error);

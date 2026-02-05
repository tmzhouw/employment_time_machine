import 'dotenv/config';
import { supabaseAdmin as supabase } from '../lib/supabase-admin';

async function checkMonths() {
    console.log('--- Checking Imported Months ---');

    const { data, error } = await supabase
        .from('monthly_reports')
        .select('report_month')
        .order('report_month', { ascending: true })
        .range(0, 10000);

    if (error) {
        console.error('Error fetching data:', error);
        process.exit(1);
    }

    // Get distinct months
    const monthCounts = new Map<string, number>();
    data.forEach(row => {
        const m = row.report_month;
        monthCounts.set(m, (monthCounts.get(m) || 0) + 1);
    });

    const sortedMonths = Array.from(monthCounts.keys()).sort();

    console.log(`Found ${sortedMonths.length} distinct months:`);
    sortedMonths.forEach(m => console.log(`- ${m}: ${monthCounts.get(m)} rows`));

    if (sortedMonths.length === 12) {
        console.log('✅ All 12 months are present.');
    } else {
        console.log(`⚠️ Count is ${sortedMonths.length}, expected 12.`);
    }
}

checkMonths();

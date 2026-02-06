import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDateRange() {
    const { data, error } = await supabase
        .from('monthly_reports')
        .select('report_month')
        .order('report_month', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const dates = data.map((d: any) => d.report_month);
    const uniqueMonths = [...new Set(dates)].sort();

    console.log('=== Date Range Analysis ===');
    console.log('Earliest:', uniqueMonths[0]);
    console.log('Latest:', uniqueMonths[uniqueMonths.length - 1]);
    console.log('Total Unique Months:', uniqueMonths.length);
    console.log('\nFirst 10 months:', uniqueMonths.slice(0, 10));
    console.log('\nLast 10 months:', uniqueMonths.slice(-10));

    // Year distribution
    const yearCounts = new Map<string, number>();
    uniqueMonths.forEach(month => {
        const year = month.substring(0, 4);
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    });

    console.log('\nMonths per year:');
    Array.from(yearCounts.entries()).sort().forEach(([year, count]) => {
        console.log(`  ${year}: ${count} months`);
    });
}

analyzeDateRange();

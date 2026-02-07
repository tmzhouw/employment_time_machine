import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkCompanyData() {
    const companyName = '湖北通格微电路科技有限公司';

    // Get company ID
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name, industry, town')
        .eq('name', companyName)
        .limit(1);

    if (!companies || companies.length === 0) {
        console.log('Company not found');
        return;
    }

    console.log('Company:', companies[0]);

    // Get monthly reports
    const { data: reports } = await supabase
        .from('monthly_reports')
        .select('report_month, employees_total, recruited_new, resigned_total, shortage_total')
        .eq('company_id', companies[0].id)
        .order('report_month', { ascending: true });

    console.log('\nMonthly Reports (' + (reports?.length || 0) + ' records):');
    reports?.forEach(r => {
        console.log(`  ${r.report_month}: employees=${r.employees_total}, recruited=${r.recruited_new}, resigned=${r.resigned_total}, shortage=${r.shortage_total}`);
    });

    // Check 2025 data specifically
    const reports2025 = reports?.filter(r => r.report_month.startsWith('2025'));
    console.log('\n2025 Data:', reports2025?.length || 0, 'months');
}

checkCompanyData().catch(console.error);

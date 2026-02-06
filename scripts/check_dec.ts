import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkDecTotal() {
    const { data, error } = await supabase
        .from('monthly_reports')
        .select('employees_total')
        .eq('report_month', '2025-12-01');

    if (error) {
        console.error(error);
        return;
    }

    const total = data.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);
    console.log(`December 2025 Total Employees: ${total}`);
    console.log(`Number of companies in Dec: ${data.length}`);
}

checkDecTotal();

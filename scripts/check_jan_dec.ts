import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkJanDec() {
    // Check Jan
    const { data: janData, error: janError } = await supabase
        .from('monthly_reports')
        .select('employees_total')
        .eq('report_month', '2025-01-01');

    if (janError) {
        console.error(janError);
        return;
    }

    const janTotal = janData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);

    // Check Dec
    const { data: decData, error: decError } = await supabase
        .from('monthly_reports')
        .select('employees_total')
        .eq('report_month', '2025-12-01');

    if (decError) {
        console.error(decError);
        return;
    }

    const decTotal = decData.reduce((acc, curr) => acc + (curr.employees_total || 0), 0);

    console.log(`January 2025 Total: ${janTotal.toLocaleString()} (${janData.length} companies)`);
    console.log(`December 2025 Total: ${decTotal.toLocaleString()} (${decData.length} companies)`);
    console.log(`Net Growth (Dec - Jan): ${(decTotal - janTotal).toLocaleString()}`);
    console.log(`Growth Rate: ${((decTotal - janTotal) / janTotal * 100).toFixed(2)}%`);
}

checkJanDec();

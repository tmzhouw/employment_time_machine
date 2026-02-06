
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkMonths() {
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    const counts = new Map<string, number>();

    while (hasMore) {
        const { data, error } = await supabase
            .from('monthly_reports')
            .select('report_month')
            .range(from, from + pageSize - 1);

        if (error) { console.error(error); break; }

        if (data && data.length > 0) {
            data.forEach(r => {
                counts.set(r.report_month, (counts.get(r.report_month) || 0) + 1);
            });
            from += pageSize;
            if (data.length < pageSize) hasMore = false;
        } else {
            hasMore = false;
        }
    }

    console.log('--- Records per Month ---');
    let totalRecords = 0;
    Array.from(counts.entries()).sort().forEach(([month, count]) => {
        console.log(`${month}: ${count}`);
        totalRecords += count;
    });
    console.log(`Total Records: ${totalRecords}`);
}

checkMonths();

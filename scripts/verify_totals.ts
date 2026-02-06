
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTotals() {
    let totalRecruited = 0;
    let totalResigned = 0;

    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('monthly_reports')
            .select('recruited_new, resigned_total')
            .range(from, from + pageSize - 1);

        if (error) {
            console.error(error);
            break;
        }

        if (data && data.length > 0) {
            data.forEach(row => {
                totalRecruited += row.recruited_new || 0;
                totalResigned += row.resigned_total || 0;
            });
            from += pageSize;
            if (data.length < pageSize) hasMore = false;
        } else {
            hasMore = false;
        }
    }

    console.log(`DB Total Recruited: ${totalRecruited}`);
    console.log(`DB Total Resigned: ${totalResigned}`);
    console.log(`DB Net Growth: ${totalRecruited - totalResigned}`);
}

checkTotals();

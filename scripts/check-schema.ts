
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .neq('shortage_detail', '{}')
        .not('shortage_detail', 'is', null)
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Row keys:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
    } else {
        console.log('No data found');
    }
}

checkSchema();

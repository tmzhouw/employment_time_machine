import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data, error } = await supabaseAdmin.from('companies').select('*').limit(1);

    if (error) {
        console.error('Error fetching company schema:', error);
    } else if (data && data.length > 0) {
        console.log('Available columns in companies table:');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('No data found in companies table to inspect.');
    }
}

main();

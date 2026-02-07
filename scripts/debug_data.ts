
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugData() {
    console.log('🔍 Debugging shortage_detail column...');

    // 1. Fetch one row
    const { data: rows, error: fetchError } = await supabase
        .from('monthly_reports')
        .select('*')
        .gt('shortage_total', 0)
        .limit(1);

    if (fetchError) {
        console.error('❌ Fetch Error:', fetchError);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log('⚠️ No rows with shortage > 0 found.');
        return;
    }

    const row = rows[0];
    console.log('📄 Sample Row:', {
        id: row.id,
        employees: row.employees_total,
        shortage: row.shortage_total,
        shortage_detail: row.shortage_detail // Check if this field exists in response
    });

    if (row.shortage_detail === undefined) {
        console.error('❌ `shortage_detail` column is undefined in the response! It likely does not exist.');
    } else {
        console.log('✅ `shortage_detail` column exists.');
    }

    // 2. Try to update
    console.log('🔄 Attempting update...');
    const dummyDetail = { general: 1, tech: 1, mgmt: 1 };

    const { error: updateError } = await supabase
        .from('monthly_reports')
        .update({ shortage_detail: dummyDetail })
        .eq('id', row.id);

    if (updateError) {
        console.error('❌ Update Failed:', updateError);
    } else {
        console.log('✅ Update Successful!');
    }
}

debugData();

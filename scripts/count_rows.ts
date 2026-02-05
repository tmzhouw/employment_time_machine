import 'dotenv/config';
import { supabaseAdmin as supabase } from '../lib/supabase-admin';

async function countRows() {
    const { count, error } = await supabase
        .from('monthly_reports')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error(error);
    } else {
        console.log(`Current Monthly Reports Count: ${count}`);
    }
}

countRows();

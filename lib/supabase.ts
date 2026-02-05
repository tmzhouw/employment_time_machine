
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // On server we can use service role for reading all data

console.log('Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    nodeEnv: process.env.NODE_ENV
});

if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Missing Supabase environment variables! URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

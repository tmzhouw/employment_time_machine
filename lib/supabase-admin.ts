import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create the client once at module load, with fallback for edge cases
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: SupabaseClient;

if (supabaseUrl && supabaseKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });
} else {
    // Create a dummy client that will fail gracefully
    // This allows the module to load even if env vars are missing during build
    console.warn('Supabase Admin: Environment variables not found, creating placeholder client');
    supabaseAdmin = createClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

export { supabaseAdmin };

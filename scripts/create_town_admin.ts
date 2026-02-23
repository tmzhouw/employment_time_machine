import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Since we don't have direct SQL access easily via JS SDK, we'll just create a test town admin
    // assuming the column can be added or we manage it via metadata.
    // Actually, Supabase doesn't easily allow raw ALTER TABLE from JS.
    // Let's create a TOWN_ADMIN user and store their town in raw_user_meta_data or we just add a town column via UI.
    // Wait, auth_users is OUR table, not auth.users. 
    console.log('Ensure you add "town (TEXT)" column to "auth_users" table in Supabase UI if not done.');

    const passwordHash = await bcrypt.hash('123456', 10);
    const username = 'townadmin';
    const testTown = '多祥'; // Pick a real town from the data

    console.log(`Creating test town admin '${username}' for town '${testTown}'...`);

    const { data: existing } = await supabaseAdmin.from('auth_users').select('id').eq('username', username).maybeSingle();

    if (existing) {
        const { error } = await supabaseAdmin.from('auth_users').update({
            password_hash: passwordHash,
            role: 'TOWN_ADMIN',
            company_id: null,
            town: testTown
        }).eq('id', existing.id);

        if (error) console.error('❌ Supabase Update Error:', error.message);
        else console.log(`✅ Updated existing ${username}. Login: ${username} / 123456`);
    } else {
        const { error } = await supabaseAdmin.from('auth_users').insert({
            company_id: null,
            username,
            password_hash: passwordHash,
            role: 'TOWN_ADMIN',
            town: testTown
        });
        if (error) console.error('❌ Supabase Insert Error:', error.message);
        else console.log(`✅ Created new ${username}. Login: ${username} / 123456`);
    }
}

main().catch(console.error);

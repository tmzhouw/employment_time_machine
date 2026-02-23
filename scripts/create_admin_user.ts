import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const passwordHash = await bcrypt.hash('123456', 10);
    const username = 'adminuser';

    console.log(`Creating test admin '${username}' with password '123456'...`);

    const { data: existing } = await supabaseAdmin.from('auth_users').select('id').eq('username', username).maybeSingle();

    if (existing) {
        const { error } = await supabaseAdmin.from('auth_users').update({
            password_hash: passwordHash,
            role: 'SUPER_ADMIN',
            company_id: null
        }).eq('id', existing.id);

        if (error) console.error('❌ Supabase Error:', error);
        else console.log('✅ Updated existing adminuser. You can now login with adminuser / 123456');
    } else {
        const { error } = await supabaseAdmin.from('auth_users').insert({
            company_id: null,
            username,
            password_hash: passwordHash,
            role: 'SUPER_ADMIN'
        });
        if (error) console.error('❌ Supabase Error:', error);
        else console.log('✅ Created new adminuser. You can now login with adminuser / 123456');
    }
}

main().catch(console.error);

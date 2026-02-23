import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const passwordHash = await bcrypt.hash('123456', 10);
    const username = 'testuser';

    console.log(`Creating test user '${username}' with password '123456'...`);

    const { data: companies, error: compErr } = await supabaseAdmin.from('companies').select('id, name').limit(1);

    if (compErr || !companies || companies.length === 0) {
        console.error('❌ Could not find a company to bind to.');
        return;
    }

    const company = companies[0];
    console.log(`Binding to company: ${company.name} (${company.id})`);

    const { data: existing } = await supabaseAdmin.from('auth_users').select('id').eq('username', username).maybeSingle();

    if (existing) {
        const { error } = await supabaseAdmin.from('auth_users').update({
            password_hash: passwordHash,
            company_id: company.id
        }).eq('id', existing.id);

        if (error) console.error('❌ Supabase Error:', error);
        else console.log('✅ Updated existing testuser. You can now login with testuser / 123456');
    } else {
        const { error } = await supabaseAdmin.from('auth_users').insert({
            company_id: company.id,
            username,
            password_hash: passwordHash,
            role: 'ENTERPRISE'
        });
        if (error) console.error('❌ Supabase Error:', error);
        else console.log('✅ Created new testuser. You can now login with testuser / 123456');
    }
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Find any company to link to
    const { data: companies } = await supabaseAdmin.from('companies').select('id, name').limit(1);
    if (!companies || companies.length === 0) return console.error('No companies found');
    const comp = companies[0];

    const passwordHash = await bcrypt.hash('123456', 10);
    const username = 'testenterprise';

    console.log(`Creating test enterprise '${username}' for company '${comp.name}'...`);

    const { data: existing } = await supabaseAdmin.from('auth_users').select('id').eq('username', username).maybeSingle();

    if (existing) {
        await supabaseAdmin.from('auth_users').update({
            password_hash: passwordHash,
            company_id: comp.id,
            role: 'ENTERPRISE'
        }).eq('id', existing.id);
        console.log('✅ Updated existing textenterprise.');
    } else {
        await supabaseAdmin.from('auth_users').insert({
            company_id: comp.id,
            username,
            password_hash: passwordHash,
            role: 'ENTERPRISE'
        });
        console.log('✅ Created new testenterprise.');
    }
}

main().catch(console.error);

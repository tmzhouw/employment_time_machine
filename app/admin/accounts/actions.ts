'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function getAccounts() {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    // Fetch all companies
    const PAGE_SIZE = 1000;
    let allCompanies: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await supabaseAdmin
            .from('companies')
            .select('id, name, town')
            .range(from, to);

        if (error) console.error('getAccounts Supabase Error:', error);

        if (data && data.length > 0) {
            allCompanies = allCompanies.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
        } else {
            hasMore = false;
        }
    }

    // Fetch all enterprise users
    let allUsers: any[] = [];
    page = 0;
    hasMore = true;
    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data } = await supabaseAdmin
            .from('auth_users')
            .select('id, company_id, username, created_at, last_login')
            .eq('role', 'ENTERPRISE')
            .range(from, to);

        if (data && data.length > 0) {
            allUsers = allUsers.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
        } else {
            hasMore = false;
        }
    }

    const userMap = new Map(allUsers.map(u => [u.company_id, u]));

    // Filter by town if TOWN_ADMIN
    return allCompanies.filter((comp) => {
        if (session.user.role === 'TOWN_ADMIN') {
            return comp.town === session.user.town;
        }
        return true;
    }).map(comp => {
        const user = userMap.get(comp.id);
        return {
            companyId: comp.id,
            companyName: comp.name,
            town: comp.town,
            hasAccount: !!user,
            userId: user?.id,
            username: user?.username,
            lastLogin: user?.last_login,
            createdAt: user?.created_at
        };
    }).sort((a, b) => {
        // Sort by lacks account first, then by town
        if (a.hasAccount === b.hasAccount) {
            return (a.town || '').localeCompare(b.town || '');
        }
        return a.hasAccount ? 1 : -1;
    });
}

export async function generateAccount(companyId: string) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    // get company info
    const { data: company, error: compErr } = await supabaseAdmin.from('companies').select('id, name, contact_phone').eq('id', companyId).single();
    if (compErr || !company) throw new Error('Company not found');

    // check if account already exists
    const { data: existing } = await supabaseAdmin.from('auth_users').select('id').eq('company_id', companyId).maybeSingle();
    if (existing) throw new Error('Account already exists');

    // use contact_phone as username if available, otherwise fallback to hr_ prefix
    const username = company.contact_phone ? String(company.contact_phone).trim() : `hr_${company.id.substring(0, 6)}`;
    const passwordHash = await bcrypt.hash('123456', 10);

    const { error } = await supabaseAdmin.from('auth_users').insert({
        company_id: company.id,
        username,
        password_hash: passwordHash,
        role: 'ENTERPRISE'
    });

    if (error) throw new Error('Database Error: ' + error.message);
    return { success: true, username, password: '123456' };
}

export async function resetPassword(userId: string) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    const passwordHash = await bcrypt.hash('123456', 10);
    const { error } = await supabaseAdmin.from('auth_users').update({
        password_hash: passwordHash
    }).eq('id', userId);

    if (error) throw new Error('Database Error: ' + error.message);
    return { success: true, password: '123456' };
}

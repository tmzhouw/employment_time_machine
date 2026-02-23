'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getEnterprises(page: number = 1, search: string = '') {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    const pageSize = 15;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
        .from('companies')
        .select(`
            *,
            auth_users!companies_manager_id_fkey(username)
        `, { count: 'exact' });

    if (search) {
        // Simple search on company name or phone
        query = query.or(`name.ilike.%${search}%,contact_phone.ilike.%${search}%`);
    }

    const { data: companies, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    // If no companies found, avoid querying auth_users with empty array
    if (!companies || companies.length === 0) {
        return { companies: [], managers: [], totalCount: count || 0 };
    }

    // Fetch related auth statuses only for the paginated companies
    const companyIds = companies.map(c => c.id);
    const { data: users, error: uErr } = await supabaseAdmin
        .from('auth_users')
        .select('id, company_id, username, is_active, last_login')
        .eq('role', 'ENTERPRISE')
        .in('company_id', companyIds);

    if (uErr) throw new Error(uErr.message);

    const userMap = new Map(users.map(u => [u.company_id, u]));

    const { data: managers, error: mErr } = await supabaseAdmin
        .from('auth_users')
        .select('id, username')
        .eq('role', 'TOWN_ADMIN')
        .eq('is_active', true);

    if (mErr) throw new Error(mErr.message);

    return {
        companies: companies.map(c => ({
            ...c,
            manager_username: c.auth_users?.username || '未分配',
            auth: userMap.get(c.id) || null
        })),
        managers,
        totalCount: count || 0
    };
}

export async function createEnterprise(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return { error: '仅超级管理员可新增企业' };
    }

    const name = formData.get('name') as string;
    const town = formData.get('town') as string;
    const industry = formData.get('industry') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const phone = formData.get('contactPhone') as string;

    if (!name || !town || !industry || !contactPerson || !phone || phone.length < 11) {
        return { error: '带 * 号字段为必填项且需有效' };
    }

    try {
        // 1. Check if phone is already used globally
        const { data: existingUser } = await supabaseAdmin
            .from('auth_users')
            .select('id')
            .eq('username', phone)
            .single();

        if (existingUser) {
            return { error: '该手机号已被其他企业绑定，请更换。' };
        }

        // 2. Insert Company
        const { data: newCompany, error: compErr } = await supabaseAdmin
            .from('companies')
            .insert({ name, town, industry, contact_person: contactPerson, contact_phone: phone })
            .select()
            .single();

        if (compErr) {
            console.error('Create company error:', compErr);
            return { error: '创建企业失败: ' + compErr.message };
        }

        // 3. Generate Auth Account
        const defaultPasswordHash = await bcrypt.hash('123456', 10);
        const { error: authErr } = await supabaseAdmin
            .from('auth_users')
            .insert({
                company_id: newCompany.id,
                username: phone, // using phone as username directly
                password_hash: defaultPasswordHash,
                role: 'ENTERPRISE',
                must_change_password: true
            });

        if (authErr) {
            console.error('Create auth error:', authErr);
            return { error: '企业已建，但生成账号失败: ' + authErr.message };
        }

        // Log audit
        await supabaseAdmin.from('admin_audit_logs').insert({
            admin_id: session.user.id,
            action: 'CREATE_ENTERPRISE',
            target_company_id: newCompany.id,
            details: { name, phone }
        });

        revalidatePath('/admin/enterprises');
        return { success: true, message: `企业建立成功！登录账号为: ${phone} (初始密码: 123456)` };

    } catch (e: any) {
        return { error: '创建失败，发生未知错误。' };
    }
}

export async function updateEnterpriseData(companyId: string, payload: {
    name: string,
    town: string,
    industry: string,
    contact_person: string,
    contact_phone: string,
    manager_id: string | null,
    is_active: boolean
}) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new Error('未授权操作');
    }

    if (!payload.contact_phone || payload.contact_phone.length < 11) {
        throw new Error('手机号无效');
    }

    // 1. Check uniqueness for phone mapping
    const { data: duplicate } = await supabaseAdmin
        .from('auth_users')
        .select('id')
        .eq('username', payload.contact_phone)
        .neq('company_id', companyId)
        .single();

    if (duplicate) throw new Error('该手机号已经被其他企业占用');

    // 2. Update company details
    const { error: compErr } = await supabaseAdmin.from('companies').update({
        name: payload.name,
        town: payload.town,
        industry: payload.industry,
        contact_person: payload.contact_person,
        contact_phone: payload.contact_phone,
        manager_id: payload.manager_id || null
    }).eq('id', companyId);

    if (compErr) throw new Error(compErr.message);

    // 3. Update auth user details directly mapped to this company
    const { error: authErr } = await supabaseAdmin.from('auth_users')
        .update({
            username: payload.contact_phone,
            is_active: payload.is_active
        })
        .eq('company_id', companyId)
        .eq('role', 'ENTERPRISE');

    if (authErr) throw new Error(authErr.message);

    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'UPDATE_ENTERPRISE',
        target_company_id: companyId,
        details: { action: 'Comprehensive Update', payload }
    });

    revalidatePath('/admin/enterprises');
    return { success: true };
}

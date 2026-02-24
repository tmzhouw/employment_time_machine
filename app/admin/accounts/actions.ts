'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getAccountData() {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new Error('只有超级管理员可以访问此页面');
    }

    // 1 & 2 & 3. Fetch Managers, Enterprises, and Admins Concurrently
    const [managersResp, enterprisesResp, adminsResp] = await Promise.all([
        supabaseAdmin
            .from('auth_users')
            .select('id, username, is_active, last_login')
            .eq('role', 'TOWN_ADMIN')
            .order('created_at', { ascending: false }),

        supabaseAdmin
            .from('auth_users')
            .select('id, username, is_active, last_login, company_id')
            .eq('role', 'ENTERPRISE')
            .order('created_at', { ascending: false }),

        supabaseAdmin
            .from('auth_users')
            .select('id, username, is_active, last_login')
            .eq('role', 'SUPER_ADMIN')
            .order('created_at', { ascending: false })
    ]);

    if (managersResp.error) throw new Error(managersResp.error.message);
    if (enterprisesResp.error) throw new Error(enterprisesResp.error.message);
    if (adminsResp.error) throw new Error(adminsResp.error.message);

    const managers = managersResp.data || [];
    const enterprises = enterprisesResp.data || [];
    const admins = adminsResp.data || [];

    // 4. Fetch company names for enterprise accounts
    const companyIds = enterprises.map(e => e.company_id).filter(Boolean);
    let companyMap = new Map<string, string>();
    if (companyIds.length > 0) {
        const { data: companies } = await supabaseAdmin
            .from('companies')
            .select('id, name')
            .in('id', companyIds);
        companyMap = new Map((companies || []).map(c => [c.id, c.name]));
    }

    const enterprisesWithNames = enterprises.map(e => ({
        ...e,
        companyName: companyMap.get(e.company_id) || '未关联'
    }));

    return {
        managers,
        enterprises: enterprisesWithNames,
        admins
    };
}

export async function createManager(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return { error: '未授权' };
    }

    const username = formData.get('username') as string;
    const desc = formData.get('desc') as string;

    if (!username || username.length < 4) {
        return { error: '账号名称必须至少4个字符' };
    }

    try {
        const { data: existing } = await supabaseAdmin
            .from('auth_users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) return { error: '该管理员账号已存在' };

        const defaultPasswordHash = await bcrypt.hash('123456', 10);

        const { data: newUser, error: createErr } = await supabaseAdmin
            .from('auth_users')
            .insert({
                username,
                password_hash: defaultPasswordHash,
                role: 'TOWN_ADMIN',
                must_change_password: true
            })
            .select()
            .single();

        if (createErr) throw new Error(createErr.message);

        await supabaseAdmin.from('admin_audit_logs').insert({
            admin_id: session.user.id,
            action: 'CREATE_MANAGER',
            target_user_id: newUser.id,
            details: { username, desc }
        });

        revalidatePath('/admin/accounts');
        return { success: true, message: `专员账号 ${username} 创建成功，初始密码 123456` };

    } catch (e: any) {
        return { error: e.message || '创建失败' };
    }
}

export async function resetManagerPassword(userId: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new Error('未授权');
    }

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const { error } = await supabaseAdmin
        .from('auth_users')
        .update({
            password_hash: defaultPasswordHash,
            must_change_password: true
        })
        .eq('id', userId)
        .eq('role', 'TOWN_ADMIN');

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'RESET_PASSWORD',
        target_user_id: userId,
        details: { action: 'Force reset to 123456', role: 'TOWN_ADMIN' }
    });

    revalidatePath('/admin/accounts');
    return { success: true };
}

export async function resetEnterprisePassword(userId: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new Error('未授权');
    }

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const { error } = await supabaseAdmin
        .from('auth_users')
        .update({
            password_hash: defaultPasswordHash,
            must_change_password: true
        })
        .eq('id', userId)
        .eq('role', 'ENTERPRISE');

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'RESET_PASSWORD',
        target_user_id: userId,
        details: { action: 'Force reset to 123456', role: 'ENTERPRISE' }
    });

    revalidatePath('/admin/accounts');
    return { success: true };
}

export async function changeAdminPassword(oldRaw: string, newRaw: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new Error('未授权');
    }

    if (!newRaw || newRaw.length < 6) {
        throw new Error('新密码太短 (至少6位)');
    }

    const { data: user } = await supabaseAdmin
        .from('auth_users')
        .select('password_hash')
        .eq('id', session.user.id)
        .single();

    if (!user) throw new Error('用户不存在');

    const isValid = await bcrypt.compare(oldRaw, user.password_hash);
    if (!isValid) throw new Error('原密码错误');

    const newHash = await bcrypt.hash(newRaw, 10);

    const { error } = await supabaseAdmin
        .from('auth_users')
        .update({ password_hash: newHash })
        .eq('id', session.user.id);

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'CHANGE_OWN_PASSWORD',
        details: { action: 'Changed self password' }
    });

    return { success: true };
}

export async function createAdmin(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN' || session.user.username !== 'adminuser') {
        return { error: '只有超管 adminuser 可以创建管理员账号' };
    }

    const username = formData.get('username') as string;

    if (!username || username.length < 4) {
        return { error: '账号名称必须至少4个字符' };
    }

    try {
        const { data: existing } = await supabaseAdmin
            .from('auth_users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) return { error: '该账号已存在' };

        const defaultPasswordHash = await bcrypt.hash('123456', 10);

        const { data: newUser, error: createErr } = await supabaseAdmin
            .from('auth_users')
            .insert({
                username,
                password_hash: defaultPasswordHash,
                role: 'SUPER_ADMIN',
                must_change_password: true
            })
            .select()
            .single();

        if (createErr) throw new Error(createErr.message);

        await supabaseAdmin.from('admin_audit_logs').insert({
            admin_id: session.user.id,
            action: 'CREATE_MANAGER',
            target_user_id: newUser.id,
            details: { username, role: 'SUPER_ADMIN' }
        });

        revalidatePath('/admin/accounts');
        return { success: true, message: `管理员账号 ${username} 创建成功，初始密码 123456` };

    } catch (e: any) {
        return { error: e.message || '创建失败' };
    }
}

export async function resetAdminPassword(userId: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN' || session.user.username !== 'adminuser') {
        throw new Error('只有超管 adminuser 可以重置管理员密码');
    }

    // Prevent resetting own password via this route
    if (userId === session.user.id) {
        throw new Error('不能通过此方式重置自己的密码，请使用修改密码功能');
    }

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const { error } = await supabaseAdmin
        .from('auth_users')
        .update({
            password_hash: defaultPasswordHash,
            must_change_password: true
        })
        .eq('id', userId)
        .eq('role', 'SUPER_ADMIN');

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'RESET_PASSWORD',
        target_user_id: userId,
        details: { action: 'Force reset to 123456', role: 'SUPER_ADMIN' }
    });

    revalidatePath('/admin/accounts');
    return { success: true };
}


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

    // Fetch Managers (TOWN_ADMIN role acting as Reporting Admins)
    const { data: managers, error: mgrErr } = await supabaseAdmin
        .from('auth_users')
        .select('id, username, is_active, last_login')
        .eq('role', 'TOWN_ADMIN')
        .order('created_at', { ascending: false });

    if (mgrErr) throw new Error(mgrErr.message);

    return {
        managers
    };
}

export async function createManager(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return { error: '未授权' };
    }

    const username = formData.get('username') as string;
    const desc = formData.get('desc') as string; // Optional description/name mapped to 'town' column for legacy compatibility

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

        // We reuse the 'town' column to store the manager's display name or region desc
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

        // Log it
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
        details: { action: 'Force reset to 123456' }
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

    // Verify old password
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

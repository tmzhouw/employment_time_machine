'use server';

import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function changePassword(prevState: any, formData: FormData) {
    const session = await getSession();

    if (!session || !session.user.id) {
        return { error: '未授权或登录已过期，请重新登录。' };
    }

    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!newPassword || newPassword.length < 6) {
        return { error: '密码长度至少需要6位。' };
    }

    if (newPassword !== confirmPassword) {
        return { error: '两次输入的密码不一致。' };
    }

    try {
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const { error } = await supabaseAdmin.from('auth_users').update({
            password_hash: passwordHash
        }).eq('id', session.user.id);

        if (error) {
            console.error('Change password DB error:', error);
            return { error: '由于系统原因修改失败，请稍后重试。' };
        }

        return { success: true };
    } catch (e: any) {
        console.error('Change password error:', e);
        return { error: '修改密码时发生未知错误。' };
    }
}

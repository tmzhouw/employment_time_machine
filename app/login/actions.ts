'use server';

import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPgPool } from '@/lib/db';
import { login } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function authenticateForm(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: '请输入账号和密码' };
    }

    // First try the local PG pool if it exists
    const pool = getPgPool();
    let user: any = null;

    try {
        if (pool) {
            const res = await pool.query('SELECT * FROM auth_users WHERE username = $1', [username]);
            user = res.rows[0];
        } else {
            // Fallback to Supabase Admin RPC/direct query for remote dev
            const { data, error } = await supabaseAdmin
                .from('auth_users')
                .select('*')
                .eq('username', username)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is not found
                console.error('Login Supabase error:', error);
            }
            user = data;
        }

        if (!user) {
            return { error: '账号或密码错误 (User not found)' };
        }

        if (!user.is_active) {
            return { error: '账号已被冻结，请联系相关政府主管单位' };
        }

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordsMatch) {
            return { error: '账号或密码错误 (Invalid password)' };
        }

        // Successful login
        await login({
            id: user.id,
            username: user.username,
            role: user.role,
            companyId: user.company_id,
            mustChangePassword: user.must_change_password
        });

        // Update last login
        if (pool) {
            await pool.query('UPDATE auth_users SET last_login = NOW() WHERE id = $1', [user.id]);
        } else {
            await supabaseAdmin.from('auth_users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
        }

    } catch (err: any) {
        console.error('Authentication error:', err);
        return { error: '系统错误，请稍后再试' };
    }

    // Redirect based on role and must_change_password flag
    if (user.must_change_password) {
        redirect('/portal/profile'); // Force them to the profile page to change password
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'TOWN_ADMIN') {
        redirect('/admin');
    } else {
        redirect('/portal');
    }
}

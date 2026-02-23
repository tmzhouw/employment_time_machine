'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';

export async function getSystemData() {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new Error('只有超级管理员可以访问系统设置');
    }

    // Fetch Recent Audit Logs (Limit 100 for dedicated view)
    const { data: logs, error: logErr } = await supabaseAdmin
        .from('admin_audit_logs')
        .select(`
            id, action, details, created_at,
            admin:auth_users!admin_audit_logs_admin_id_fkey(username),
            target_user:auth_users!admin_audit_logs_target_user_id_fkey(username),
            target_company:companies(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (logErr) throw new Error(logErr.message);

    return {
        logs: logs.map(l => ({
            ...l,
            admin_name: (l.admin as any)?.username || '系统',
            target_user_name: (l.target_user as any)?.username,
            target_company_name: (l.target_company as any)?.name
        }))
    };
}

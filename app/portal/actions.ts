'use server';

import { getSession } from '@/lib/auth';
import { getPgPool } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function submitReport(prevState: any, formData: FormData) {
    const session = await getSession();

    if (!session || !session.user.companyId || session.user.role !== 'ENTERPRISE') {
        return { error: '未授权或登录已过期，请重新登录。' };
    }

    const companyId = session.user.companyId;
    const reportMonth = formData.get('reportMonth') as string; // 'YYYY-MM-01'

    const employeesTotal = parseInt(formData.get('employeesTotal') as string) || 0;
    const recruitedNew = parseInt(formData.get('recruitedNew') as string) || 0;
    const resignedTotal = parseInt(formData.get('resignedTotal') as string) || 0;

    // Detailed Shortage and Recruitment
    const shortageGeneral = parseInt(formData.get('shortageGeneral') as string) || 0;
    const shortageTech = parseInt(formData.get('shortageTech') as string) || 0;
    const shortageMgmt = parseInt(formData.get('shortageMgmt') as string) || 0;
    const plannedRecruitment = parseInt(formData.get('plannedRecruitment') as string) || 0;

    const shortageTotal = shortageGeneral + shortageTech + shortageMgmt;

    // Salary fields
    const salaryGeneral = parseFloat(formData.get('salaryGeneral') as string) || 0;
    const salaryTech = parseFloat(formData.get('salaryTech') as string) || 0;
    const salaryMgmt = parseFloat(formData.get('salaryMgmt') as string) || 0;

    const shortageDetail = {
        general: shortageGeneral,
        tech: shortageTech,
        management: shortageMgmt,
        salary_mgmt: salaryMgmt
    };

    if (!reportMonth) {
        return { error: '缺少报表月份信息' };
    }

    // Safety limits (e.g. negative numbers)
    if (employeesTotal < 0 || recruitedNew < 0 || resignedTotal < 0 || shortageTotal < 0) {
        return { error: '人数不能为负数' };
    }

    const payload = {
        company_id: companyId,
        report_month: reportMonth,
        employees_total: employeesTotal,
        recruited_new: recruitedNew,
        resigned_total: resignedTotal,
        shortage_total: shortageTotal,
        shortage_detail: shortageDetail,
        planned_recruitment: plannedRecruitment,
        salary_general: salaryGeneral,
        salary_tech: salaryTech,
        status: 'SUBMITTED', // Mark as submitted so admin dashboard detects it as filled
        notes: 'Submitted via Enterprise Portal'
    };

    const pool = getPgPool();
    try {
        if (pool) {
            await pool.query(
                `INSERT INTO monthly_reports 
               (company_id, report_month, employees_total, recruited_new, resigned_total, shortage_total, shortage_detail, planned_recruitment, salary_general, salary_tech, status, notes) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (company_id, report_month) 
               DO UPDATE SET 
                  employees_total = EXCLUDED.employees_total,
                  recruited_new = EXCLUDED.recruited_new,
                  resigned_total = EXCLUDED.resigned_total,
                  shortage_total = EXCLUDED.shortage_total,
                  shortage_detail = EXCLUDED.shortage_detail,
                  planned_recruitment = EXCLUDED.planned_recruitment,
                  salary_general = EXCLUDED.salary_general,
                  salary_tech = EXCLUDED.salary_tech,
                  status = EXCLUDED.status,
                  notes = EXCLUDED.notes,
                  updated_at = NOW()`,
                [
                    payload.company_id, payload.report_month, payload.employees_total,
                    payload.recruited_new, payload.resigned_total, payload.shortage_total, payload.shortage_detail,
                    payload.planned_recruitment, payload.salary_general, payload.salary_tech, payload.status, payload.notes
                ]
            );
        } else {
            const { error } = await supabaseAdmin
                .from('monthly_reports')
                .upsert(payload, { onConflict: 'company_id, report_month' });

            if (error) throw error;
        }

        revalidatePath('/portal');
        revalidatePath('/admin');
        return { success: true };

    } catch (err: any) {
        console.error('Submit report error:', err);
        return { error: '提交失败，请联系管理员。' };
    }
}

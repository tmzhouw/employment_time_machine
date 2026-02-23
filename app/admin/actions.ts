'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getReportingStatus(reportMonth: string) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    // Determine previous month for comparison
    const [yearStr, monthStr] = reportMonth.split('-');
    let prevMonthNum = parseInt(monthStr, 10) - 1;
    let prevYearNum = parseInt(yearStr, 10);
    if (prevMonthNum === 0) {
        prevMonthNum = 12;
        prevYearNum -= 1;
    }
    const prevMonthStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-01`;

    // Determine if this is the current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonthKey = `${yearStr}-${monthStr}`;
    const isCurrentMonth = currentMonthKey === selectedMonthKey;

    // 1. Fetch all companies
    const { data: allCompanies } = await supabaseAdmin
        .from('companies')
        .select('id, name, town, manager_id');

    // 2. Filter by role/manager_id
    const filteredCompanies = (allCompanies || []).filter(comp => {
        if (session.user.role === 'TOWN_ADMIN') {
            return comp.manager_id === session.user.id;
        }
        return true;
    });

    const companyIds = filteredCompanies.map(c => c.id);

    // 3. Fetch Current Month Reports
    const { data: currentReports, error: currentReportsErr } = await supabaseAdmin
        .from('monthly_reports')
        .select('company_id, status, employees_total, recruited_new, resigned_total, shortage_total, shortage_detail, planned_recruitment, updated_at, reject_reason')
        .eq('report_month', reportMonth)
        .in('company_id', companyIds);

    if (currentReportsErr) {
        console.error('[DEBUG] Error fetching current reports:', currentReportsErr);
    }

    const reportMap = new Map((currentReports || []).map(r => [r.company_id, r]));

    // 4. Fetch Previous Month Reports to calculate warnings
    const { data: prevReports } = await supabaseAdmin
        .from('monthly_reports')
        .select('company_id, employees_total')
        .eq('report_month', prevMonthStr)
        .in('company_id', companyIds)
        .not('employees_total', 'is', null);

    const prevReportMap = new Map((prevReports || []).map(r => [r.company_id, r]));

    // 5. Determine which companies to show:
    //    - Current month: show ALL companies (to track who hasn't reported yet)
    //    - Historical months: only show companies that have a report for that month
    const displayCompanies = isCurrentMonth
        ? filteredCompanies
        : filteredCompanies.filter(comp => reportMap.has(comp.id));

    // 6. Build Result array
    return displayCompanies.map(comp => {
        const report = reportMap.get(comp.id);
        const prevReport = prevReportMap.get(comp.id);

        let hasWarning = false;
        let warningDetails = '';

        if (report && report.employees_total !== undefined && prevReport && prevReport.employees_total !== undefined) {
            const current = report.employees_total;
            const previous = prevReport.employees_total;
            const changePercent = Math.abs((current - previous) / previous);

            if (changePercent >= 0.3) {
                hasWarning = true;
                warningDetails = `总人数上月 ${previous} 人，本月 ${current} 人，波动达 ${(changePercent * 100).toFixed(0)}%`;
            }
        }

        return {
            id: comp.id,
            name: comp.name,
            town: comp.town,
            status: report ? (report.status || 'SUBMITTED') : 'PENDING',
            updatedAt: report ? report.updated_at : null,
            hasWarning,
            warningDetails,
            currentEmployees: report?.employees_total || 0,
            prevEmployees: prevReport?.employees_total !== undefined
                ? prevReport.employees_total
                : (report ? (report.employees_total - (report.recruited_new || 0) + (report.resigned_total || 0)) : 0),
            recruitedNew: report?.recruited_new || 0,
            resignedTotal: report?.resigned_total || 0,
            shortageDetail: report?.shortage_detail || { general: 0, tech: 0, management: 0 },
            plannedRecruitment: report?.planned_recruitment || 0,
            rejectReason: report?.reject_reason || null
        };
    });
}

// Admin override to clear warning and manually approve with granular data
export async function approveReport(
    companyId: string,
    reportMonth: string,
    correctedEmployees?: number,
    recruitedNew?: number,
    resignedTotal?: number,
    shortageDetail?: { general: number, tech: number, management: number },
    plannedRecruitment?: number
) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    const updates: any = { status: 'APPROVED' };
    if (correctedEmployees !== undefined) {
        updates.employees_total = correctedEmployees;
    }
    if (recruitedNew !== undefined) updates.recruited_new = recruitedNew;
    if (resignedTotal !== undefined) updates.resigned_total = resignedTotal;

    if (shortageDetail !== undefined) {
        const total = (shortageDetail.general || 0) + (shortageDetail.tech || 0) + (shortageDetail.management || 0);
        updates.shortage_detail = shortageDetail;
        updates.shortage_total = total;
    }
    if (plannedRecruitment !== undefined) updates.planned_recruitment = plannedRecruitment;

    const { error } = await supabaseAdmin
        .from('monthly_reports')
        .update(updates)
        .eq('company_id', companyId)
        .eq('report_month', reportMonth);

    if (error) throw new Error(error.message);

    // Audit log
    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'EDIT_REPORT_DATA',
        target_company_id: companyId,
        details: { reportMonth, correctedEmployees, action: 'APPROVED' }
    });

    revalidatePath('/admin');
    return { success: true };
}

export async function rejectReport(
    companyId: string,
    reportMonth: string,
    reason: string
) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    if (!reason || reason.trim().length === 0) {
        throw new Error('必须填写驳回原因');
    }

    const { error } = await supabaseAdmin
        .from('monthly_reports')
        .update({
            status: 'REJECTED',
            reject_reason: reason.trim()
        })
        .eq('company_id', companyId)
        .eq('report_month', reportMonth);

    if (error) throw new Error(error.message);

    // Audit log
    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'REJECT_REPORT',
        target_company_id: companyId,
        details: { reportMonth, reason: reason.trim() }
    });

    revalidatePath('/admin');
    return { success: true };
}

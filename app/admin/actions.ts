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
    const prevMonthStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}`;

    // 1. Fetch all companies 
    // We use a simplified fetch here. In production with thousands, keep the pagination.
    const { data: allCompanies } = await supabaseAdmin
        .from('companies')
        .select('id, name, town, manager_id');

    // 2. Filter by role/manager_id
    const filteredCompanies = (allCompanies || []).filter(comp => {
        if (session.user.role === 'TOWN_ADMIN') {
            // Reporting Admin constraint: only see assigned companies
            return comp.manager_id === session.user.id;
        }
        return true; // Super Admin sees all
    });

    const companyIds = filteredCompanies.map(c => c.id);

    // 3. Fetch Current Month Reports
    const { data: currentReports } = await supabaseAdmin
        .from('monthly_reports')
        .select('company_id, status, current_employees, updated_at')
        .eq('report_month', reportMonth)
        .in('company_id', companyIds);

    const reportMap = new Map((currentReports || []).map(r => [r.company_id, r]));

    // 4. Fetch Previous Month Reports to calculate warnings
    const { data: prevReports } = await supabaseAdmin
        .from('monthly_reports')
        .select('company_id, current_employees')
        .eq('report_month', prevMonthStr)
        .in('company_id', companyIds)
        .not('current_employees', 'is', null);

    const prevReportMap = new Map((prevReports || []).map(r => [r.company_id, r]));

    // 5. Build Result array
    return filteredCompanies.map(comp => {
        const report = reportMap.get(comp.id);
        const prevReport = prevReportMap.get(comp.id);

        let hasWarning = false;
        let warningDetails = '';

        if (report && report.current_employees && prevReport && prevReport.current_employees) {
            const current = report.current_employees;
            const previous = prevReport.current_employees;
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
            currentEmployees: report?.current_employees || 0
        };
    });
}

// Admin override to clear warning and manually approve
export async function approveReport(companyId: string, reportMonth: string, correctedEmployees?: number) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    const updates: any = { status: 'APPROVED' };
    if (correctedEmployees !== undefined) {
        updates.current_employees = correctedEmployees;
    }

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

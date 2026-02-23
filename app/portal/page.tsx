import { getSession } from '@/lib/auth';
import { getPgPool } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import PortalForm from './PortalForm';

export default async function PortalPage() {
    const session = await getSession();
    if (!session || !session.user.companyId) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-100 mt-8 text-center">
                无法获取企业绑定信息，请联系管理员核对账号设置。
            </div>
        );
    }

    const companyId = session.user.companyId;

    let company: any = null;
    let lastReport: any = null;

    const pool = getPgPool();
    if (pool) {
        const cRes = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
        company = cRes.rows[0];

        const rRes = await pool.query('SELECT * FROM monthly_reports WHERE company_id = $1 ORDER BY report_month DESC LIMIT 1', [companyId]);
        lastReport = rRes.rows[0];
    } else {
        const { data: cData } = await supabaseAdmin.from('companies').select('*').eq('id', companyId).single();
        company = cData;

        // Fetch latest report for default pre-fill values
        const { data: rData } = await supabaseAdmin
            .from('monthly_reports')
            .select('*')
            .eq('company_id', companyId)
            .order('report_month', { ascending: false })
            .limit(1)
            .single();

        lastReport = rData;
    }

    if (!company) {
        return (
            <div className="bg-orange-50 text-orange-600 p-6 rounded-lg text-center mt-8 border border-orange-100">
                系统中未找到您的企业档案。
            </div>
        );
    }

    // Determine current reporting month (always first day of current month)
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const reportMonth = `${currentMonthPrefix}-01`;

    // Check if what they reported last was this exact month
    let alreadySubmitted = false;
    let baseEmployees = 0;
    let rejectReason: string | null = null;

    if (lastReport) {
        const lastReportMonth = new Date(lastReport.report_month).toISOString().slice(0, 7);
        if (lastReportMonth === currentMonthPrefix) {
            // If rejected, allow re-editing
            if (lastReport.status === 'REJECTED') {
                alreadySubmitted = false;
                rejectReason = lastReport.reject_reason || '数据有误，请重新填写';
                // Use previous month's data as base if available, otherwise derive from current report
                baseEmployees = lastReport.employees_total - (lastReport.recruited_new || 0) + (lastReport.resigned_total || 0);
            } else {
                alreadySubmitted = true;
                baseEmployees = lastReport.employees_total;
            }
        } else {
            // It's a previous month, use it as baseline
            baseEmployees = lastReport.employees_total;
        }
    }

    return (
        <PortalForm
            company={company}
            baseEmployees={baseEmployees}
            alreadySubmitted={alreadySubmitted}
            reportMonth={reportMonth}
            lastReport={lastReport}
            rejectReason={rejectReason}
        />
    );
}

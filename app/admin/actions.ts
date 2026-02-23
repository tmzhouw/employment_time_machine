'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';

export async function getReportingStatus(reportMonth: string) {
    const session = await getSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'TOWN_ADMIN')) {
        throw new Error('Unauthorized');
    }

    // 1. Fetch all companies via Supabase (paginated)
    const PAGE_SIZE = 1000;
    let allCompanies: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data } = await supabaseAdmin
            .from('companies')
            .select('id, name, town')
            .range(from, to);

        if (data && data.length > 0) {
            allCompanies = allCompanies.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
        } else {
            hasMore = false;
        }
    }

    // 2. Fetch all reports for the target month
    let allReports: any[] = [];
    page = 0;
    hasMore = true;
    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data } = await supabaseAdmin
            .from('monthly_reports')
            .select('company_id, status, updated_at')
            .eq('report_month', reportMonth)
            .range(from, to);

        if (data && data.length > 0) {
            allReports = allReports.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
        } else {
            hasMore = false;
        }
    }

    // 3. Map in memory
    const reportMap = new Map(allReports.map(r => [r.company_id, r]));

    // 4. Filter by role
    return allCompanies.filter(comp => {
        if (session.user.role === 'TOWN_ADMIN') {
            return comp.town === session.user.town;
        }
        return true;
    }).map(comp => {
        const report = reportMap.get(comp.id);
        return {
            id: comp.id,
            name: comp.name,
            town: comp.town,
            status: report ? (report.status || 'SUBMITTED') : 'PENDING',
            updatedAt: report ? report.updated_at : null
        };
    });
}

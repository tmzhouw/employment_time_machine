'use server';

import { getCompanyHistory } from '@/lib/data';

export async function fetchCompanyHistoryAction(companyName: string) {
    return await getCompanyHistory(companyName);
}

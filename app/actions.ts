'use server';

import { getCompanyHistory, getIndustryDetail } from '@/lib/data';

export async function fetchCompanyHistoryAction(companyName: string) {
    return await getCompanyHistory(companyName);
}

export async function fetchIndustryDetailAction(industryName: string) {
    return await getIndustryDetail(industryName);
}

import { getTownDetail } from '@/lib/data';

export async function fetchTownDetailAction(townName: string) {
    return await getTownDetail(townName);
}

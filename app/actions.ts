'use server';

import { getCompanyHistory, getIndustryDetail } from '@/lib/data';

export async function fetchCompanyHistoryAction(companyName: string) {
    return await getCompanyHistory(companyName);
}

export async function fetchIndustryDetailAction(industryName: string) {
    return await getIndustryDetail(industryName);
}


import { getTownDetail, getIndustryStats, getTownStats } from '@/lib/data';

export async function fetchTownDetailAction(townName: string) {
    return await getTownDetail(townName);
}

export async function fetchIndustryStatsAction(filters?: { town?: string }) {
    return await getIndustryStats(filters);
}

export async function fetchTownStatsAction(filters?: { industry?: string }) {
    return await getTownStats(filters);
}

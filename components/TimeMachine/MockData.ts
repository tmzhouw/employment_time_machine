
// Mock data for development when Supabase is not connected

export interface TrendData {
    month: string;
    total: number;
    shortage: number;
}

export interface AnomalyCompany {
    id: string;
    name: string;
    industry: string;
    recruited: number;
    resigned: number;
    months_negative: number;
}

export const MOCK_TRENDS: TrendData[] = [
    { month: '1月', total: 23215, shortage: 1200 },
    { month: '2月', total: 23500, shortage: 1800 }, // Post-CNY Shortage
    { month: '3月', total: 24100, shortage: 1500 },
    { month: '4月', total: 24500, shortage: 800 },
    { month: '5月', total: 24800, shortage: 600 },
    { month: '6月', total: 24900, shortage: 500 },
    { month: '7月', total: 24850, shortage: 550 },
    { month: '8月', total: 24950, shortage: 400 },
    { month: '9月', total: 25100, shortage: 300 }, // Peak
    { month: '10月', total: 25050, shortage: 350 },
    { month: '11月', total: 25176, shortage: 200 },
    { month: '12月', total: 25100, shortage: 250 },
];

export const MOCK_ANOMALIES: AnomalyCompany[] = [
    { id: '1', name: '天门纺织一厂', industry: '纺织服装', recruited: 15, resigned: 45, months_negative: 3 },
    { id: '2', name: '江汉电子元件', industry: '电子信息', recruited: 5, resigned: 12, months_negative: 4 },
    { id: '3', name: '鸿运机械制造', industry: '装备制造', recruited: 2, resigned: 8, months_negative: 3 },
];

export const REPORT_SUMMARY = {
    total_enterprises: 294,
    avg_employment: 24814,
    cumulative_recruited: 5164,
    net_growth: 1961,
    growth_rate: "8.45%",
};

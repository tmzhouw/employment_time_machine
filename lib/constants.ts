// "一主两新三支撑" industry policy order
// Shared between server and client components
export const INDUSTRY_POLICY_ORDER: string[] = [
    '纺织服装',       // 一主
    '生物医药化工',   // 两新
    '电子信息',       // 两新
    '装备制造',       // 三支撑
    '新能源新材料',   // 三支撑
    '农副产品深加工', // 三支撑
    '商贸物流',
    '其他',
];

/** Sort items by the "一主两新三支撑" policy order */
export function sortByIndustryPolicy<T extends { name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const idxA = INDUSTRY_POLICY_ORDER.indexOf(a.name);
        const idxB = INDUSTRY_POLICY_ORDER.indexOf(b.name);
        const orderA = idxA === -1 ? INDUSTRY_POLICY_ORDER.length : idxA;
        const orderB = idxB === -1 ? INDUSTRY_POLICY_ORDER.length : idxB;
        return orderA - orderB;
    });
}

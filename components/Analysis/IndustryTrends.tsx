'use client';

import {
    ResponsiveContainer,
    Treemap,
    Tooltip
} from 'recharts';
import { IndustryStat } from '@/lib/data';

interface IndustryTrendsProps {
    data: IndustryStat[];
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{d.name}</h3>
                <div className="space-y-1 text-sm">
                    <p className="text-slate-600">在岗: <span className="font-medium text-slate-900">{d.totalEmployees?.toLocaleString()}人</span></p>
                    <p className="text-slate-600">缺工: <span className="font-medium text-red-600">{d.shortageCount?.toLocaleString()}人</span></p>
                    <p className="text-slate-600">缺工率: <span className="font-medium text-amber-600">{d.shortageRate?.toFixed(2)}%</span></p>
                    <p className="text-slate-600">流失率: <span className="font-medium text-orange-600">{d.turnoverRate?.toFixed(2)}%</span></p>
                    <p className="text-slate-600">企业数: <span className="font-medium text-blue-600">{d.companyCount}家</span></p>
                    <p className="text-slate-600">主力乡镇: <span className="font-medium text-emerald-600">{d.topTown}</span></p>
                </div>
            </div>
        );
    }
    return null;
};

// Treemap custom content renderer
const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, turnoverRate, depth, index } = props;

    // Color by turnover rate (health indicator)
    let fillColor = '#6366f1'; // indigo (healthy)
    if (turnoverRate > 10) fillColor = '#ef4444'; // red (high turnover)
    else if (turnoverRate > 5) fillColor = '#f59e0b'; // amber (moderate)
    else if (turnoverRate > 2) fillColor = '#3b82f6'; // blue (okay)

    const clipId = `clip-industry-${index}`;
    const padding = 4;

    // Truncate name if cell is too narrow for full text
    const maxChars = Math.floor((width - padding * 2) / 16); // ~16px per char at fontSize 16
    const displayName = name && name.length > maxChars ? name.slice(0, Math.max(maxChars, 2)) + '…' : name;

    return (
        <g>
            <defs>
                <clipPath id={clipId}>
                    <rect x={x + padding} y={y + padding} width={Math.max(width - padding * 2, 0)} height={Math.max(height - padding * 2, 0)} />
                </clipPath>
            </defs>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fillColor,
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1,
                }}
            />
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={16}
                    fontWeight="bold"
                    clipPath={`url(#${clipId})`}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                    {displayName}
                </text>
            )}
            {width > 70 && height > 45 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 20}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={13}
                    fontWeight={500}
                    fillOpacity={0.95}
                    clipPath={`url(#${clipId})`}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                    {turnoverRate?.toFixed(1)}% 流失
                </text>
            )}
        </g>
    );
};

export function IndustryTrends({ data }: IndustryTrendsProps) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">暂无数据</div>;
    }

    const treeData = data.map(item => ({
        ...item,
        value: item.totalEmployees,
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col" style={{ height: '420px' }}>
            <div className="mb-4 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-900">行业规模全景 (Treemap)</h3>
                <p className="text-sm text-slate-500">
                    矩形大小代表行业用工规模，
                    <span className="text-red-500 font-medium ml-1">红色</span>代表高流失，
                    <span className="text-indigo-500 font-medium ml-1">紫色</span>代表稳定健康
                </p>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={treeData}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        fill="#6366f1"
                        content={<CustomizedContent />}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

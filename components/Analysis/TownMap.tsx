'use client';

import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { TownStat } from '@/lib/data';

interface TownMapProps {
    data: TownStat[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{data.name}</h3>
                <div className="space-y-1 text-sm">
                    <p className="text-slate-600">
                        在岗人数: <span className="font-medium text-slate-900">{data.totalEmployees}</span>
                    </p>
                    <p className="text-slate-600">
                        缺工人数: <span className="font-medium text-red-600">{data.shortageCount}</span>
                    </p>
                    <p className="text-slate-600">
                        主导产业: <span className="font-medium text-blue-600">{data.topIndustry}</span>
                    </p>
                    <p className="text-slate-600">
                        流失率: <span className="font-medium text-amber-600">{data.turnoverRate}%</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// Custom Content for Treemap to render colored rectangles
const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, colors, name, shortageRate } = props;

    // Calculate color based on shortage rate (Green -> Red)
    // Low shortage (<5%) -> Green
    // Medium (5-15%) -> Amber
    // High (>15%) -> Red
    let fillColor = '#10b981'; // green-500
    if (shortageRate > 15) fillColor = '#ef4444'; // red-500
    else if (shortageRate > 5) fillColor = '#f59e0b'; // amber-500

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fillColor,
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }} // Ensure text doesn't block tooltip
                >
                    {name}
                </text>
            )}
            {/* Show value if huge */}
            {width > 80 && height > 50 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 18}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight={500}
                    fillOpacity={0.95}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                    {Math.round(shortageRate)}% 缺口
                </text>
            )}
        </g>
    );
};

export function TownMap({ data }: TownMapProps) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">暂无数据</div>;
    }

    // Transform data for Treemap (needs 'value' key for size)
    const treeData = data.map(item => ({
        ...item,
        value: item.totalEmployees, // Size by employees
    }));

    return (
        <div className="h-[500px] w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">乡镇用工全景图 (拟态地图)</h3>
                    <p className="text-sm text-slate-500">
                        矩形大小代表用工规模，
                        <span className="text-red-500 font-medium ml-1">红色</span>代表缺工严重，
                        <span className="text-green-500 font-medium ml-1">绿色</span>代表用工健康
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={treeData}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent />}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

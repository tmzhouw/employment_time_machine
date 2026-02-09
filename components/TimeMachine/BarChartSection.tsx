
'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useState, useEffect, useMemo } from 'react';

interface BarChartSectionProps {
    data: any[];
    color?: string;
    /** Color for shortage segment */
    shortageColor?: string;
    /** Whether to show stacked shortage bars */
    showShortage?: boolean;
}

export function BarChartSection({
    data,
    color = "#3b82f6",
    shortageColor = "#f97316",
    showShortage = false
}: BarChartSectionProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Compute chart data with amplified shortage for visibility
    const { chartData, shortageFactor } = useMemo(() => {
        if (!data || data.length === 0 || !showShortage) {
            return { chartData: data, shortageFactor: 1 };
        }

        const maxValue = Math.max(...data.map(d => d.value || 0));
        const maxShortage = Math.max(...data.map(d => d.shortage || 0));

        // Scale shortage so max shortage appears as ~20% of max employment
        const factor = maxShortage > 0 ? (maxValue * 0.2) / maxShortage : 1;

        const scaled = data.map(d => ({
            ...d,
            shortage_scaled: Math.round((d.shortage || 0) * factor),
            shortage_real: d.shortage || 0,
        }));

        return { chartData: scaled, shortageFactor: factor };
    }, [data, showShortage]);

    if (!data || data.length === 0) return <div className="p-10 text-center text-gray-400">Loading chart data...</div>;
    if (!isMounted) return <div className="p-10 text-center text-gray-400">Loading chart...</div>;

    // Custom tooltip showing real values
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const employmentPayload = payload.find((p: any) => p.dataKey === 'value');
            const shortagePayload = payload.find((p: any) => p.dataKey === 'shortage_scaled');

            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm min-w-36">
                    <p className="font-bold text-gray-800 mb-1.5">{label}</p>
                    {employmentPayload && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="text-gray-500 text-xs">在岗用工:</span>
                            <span className="font-semibold text-gray-800">
                                {(employmentPayload.value || 0).toLocaleString()} 人
                            </span>
                        </div>
                    )}
                    {showShortage && shortagePayload && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: shortageColor }}></span>
                            <span className="text-gray-500 text-xs">缺工人数:</span>
                            <span className="font-semibold" style={{ color: shortageColor }}>
                                {/* Show real value, not scaled */}
                                {(payload[0]?.payload?.shortage_real || 0).toLocaleString()} 人
                            </span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Custom legend
    const renderLegend = () => {
        if (!showShortage) return null;
        return (
            <div className="flex items-center justify-center gap-5 text-xs mt-1">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="text-gray-600">用工人数</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shortageColor }}></span>
                    <span className="text-gray-600">缺工人数 <span className="text-gray-400">(已放大显示)</span></span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        barCategoryGap="25%"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={100}
                            tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                        />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                        <Bar
                            dataKey="value"
                            name="用工人数"
                            fill={color}
                            stackId={showShortage ? "stack" : undefined}
                            radius={showShortage ? [0, 0, 0, 0] : [0, 4, 4, 0]}
                            barSize={showShortage ? 22 : 20}
                        />
                        {showShortage && (
                            <Bar
                                dataKey="shortage_scaled"
                                name="缺工人数"
                                fill={shortageColor}
                                stackId="stack"
                                radius={[0, 4, 4, 0]}
                                barSize={22}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {renderLegend()}
        </div>
    );
}

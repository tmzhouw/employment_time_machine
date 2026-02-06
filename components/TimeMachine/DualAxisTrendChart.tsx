'use client';

import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface DualAxisTrendChartProps {
    data: {
        month: string;
        total: number;
        shortage: number;
    }[];
}

export function DualAxisTrendChart({ data }: DualAxisTrendChartProps) {
    if (!data || data.length === 0) return <div className="p-10 text-center text-gray-400">Loading chart data...</div>;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    dy={10}
                />
                <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    label={{ value: '在岗人数', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 12 } }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    label={{ value: '缺工人数', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF', fontSize: 12 } }}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar
                    yAxisId="left"
                    dataKey="total"
                    name="在岗职工数"
                    barSize={30}
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="shortage"
                    name="缺工人数"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

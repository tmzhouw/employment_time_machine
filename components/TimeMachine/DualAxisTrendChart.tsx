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
import { useState, useEffect } from 'react';

interface DualAxisTrendChartProps {
    data: {
        month: string;
        total: number;
        shortage: number;
    }[];
}

export function DualAxisTrendChart({ data }: DualAxisTrendChartProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!data || data.length === 0) return <div className="p-10 text-center text-gray-400">Loading chart data...</div>;
    if (!isMounted) return <div className="p-10 text-center text-gray-400">Loading chart...</div>;

    const margin = isMobile
        ? { top: 10, right: 10, left: 0, bottom: 5 }
        : { top: 20, right: 30, left: 20, bottom: 5 };

    const leftTicks = isMobile ? [0, 13000, 26000] : undefined;
    const rightTicks = isMobile ? [0, 300, 600] : undefined;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={margin}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    dy={10}
                    interval={isMobile ? 1 : 0}
                />
                <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    ticks={leftTicks}
                    width={isMobile ? 40 : 60}
                    label={isMobile ? undefined : { value: '在岗人数', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 12 } }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    ticks={rightTicks}
                    width={isMobile ? 35 : 60}
                    label={isMobile ? undefined : { value: '缺工人数', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF', fontSize: 12 } }}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={isMobile ? { fontSize: 11 } : undefined} />
                <Bar
                    yAxisId="left"
                    dataKey="total"
                    name="在岗职工数"
                    barSize={isMobile ? 16 : 30}
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="shortage"
                    name="缺工人数"
                    stroke="#EF4444"
                    strokeWidth={isMobile ? 2 : 3}
                    dot={{ r: isMobile ? 3 : 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}


'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';

export function ChartSection({ data }: { data: any[] }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!data || data.length === 0) return <div className="p-10 text-center text-gray-400">Loading chart data...</div>;
    if (!isMounted) return <div className="p-10 text-center text-gray-400">Loading chart...</div>;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#9ca3af' }}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    name="在岗职工总数"
                    stroke="#1e3a8a"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    dot={{ r: 4, strokeWidth: 2 }}
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="shortage"
                    name="缺工人数"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

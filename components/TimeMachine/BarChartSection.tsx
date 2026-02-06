
'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-gray-800 mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
                    <span className="font-medium" style={{ color: payload[0].color }}>
                        {payload[0].value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function BarChartSection({ data, color = "#3b82f6" }: { data: any[], color?: string }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!data || data.length === 0) return <div className="p-10 text-center text-gray-400">Loading chart data...</div>;
    if (!isMounted) return <div className="p-10 text-center text-gray-400">Loading chart...</div>;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 12, fill: '#4b5563' }}
                />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
}

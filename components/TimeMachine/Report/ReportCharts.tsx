"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

// 工业数据美学配色 (Consistent with globals.css variables)
const COLORS = {
    primary: "#1e3a5f",
    secondary: "#2c5282", // chart-2
    accent: "#b8860b",    // chart-4
    muted: "#64748b",
    chart: ["#1e3a5f", "#2c5282", "#3182ce", "#b8860b", "#4299e1", "#90cdf4"]
};

interface ChartProps {
    data: any[];
    title: string;
    description?: string;
    height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3 rounded-lg shadow-lg text-sm">
                <p className="font-semibold text-slate-700 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-slate-600">
                        <span style={{ color: entry.color, marginRight: '8px' }}>●</span>
                        {entry.name}:
                        <span className="font-mono ml-2 font-bold">{entry.value.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// 简单的卡片容器
function ReportCard({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
            <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-lg sm:text-xl font-semibold text-primary font-serif tracking-tight">{title}</h3>
                {description && <p className="text-xs sm:text-sm text-gray-500 mt-1">{description}</p>}
            </div>
            <div className="p-4 sm:p-6">
                {children}
            </div>
        </div>
    );
}

// 行业用工柱状图
export function IndustryBarChart({ data, title, description }: ChartProps) {
    return (
        <ReportCard title={title} description={description}>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Bar dataKey="employees" name="现有员工" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="newHires" name="新招人数" fill={COLORS.secondary} radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </ReportCard>
    );
}

// 乡镇用工对比图
export function TownComparisonChart({ data, title, description }: ChartProps) {
    return (
        <ReportCard title={title} description={description}>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} hide />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                        width={70}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Bar dataKey="employees" name="现有员工" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={12} background={{ fill: '#f8fafc' }} />
                </BarChart>
            </ResponsiveContainer>
        </ReportCard>
    );
}

// 岗位需求饼图
export function PositionPieChart({ data, title, description }: ChartProps) {
    const RADIAN = Math.PI / 180;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <ReportCard title={title} description={description}>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </ReportCard>
    );
}

// 月度趋势折线图
export function MonthlyTrendChart({ data, title, description }: ChartProps) {
    return (
        <ReportCard title={title} description={description}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Line type="monotone" dataKey="employees" name="员工总数" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="newHires" name="新招人数" stroke={COLORS.accent} strokeWidth={3} dot={{ fill: COLORS.accent, r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </ReportCard>
    );
}

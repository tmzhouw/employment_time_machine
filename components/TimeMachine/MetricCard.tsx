
import React from 'react';
import { clsx } from 'clsx';

interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    subValue?: string;
    subLabel?: string;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}

export function MetricCard({ title, value, unit, subValue, subLabel, trend, className }: MetricCardProps) {
    return (
        <div className={clsx("bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32", className)}>
            <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
            <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                    {value}
                </span>
                {unit && <span className="ml-1 text-sm text-slate-400">{unit}</span>}
            </div>
            {(subValue || subLabel) && (
                <div className="mt-auto pt-2 flex items-center text-xs text-slate-400">
                    {subLabel && <span className="mr-1">{subLabel}</span>}
                    <span className={clsx(
                        "font-medium",
                        trend === 'up' ? "text-emerald-600" :
                            trend === 'down' ? "text-rose-600" : "text-slate-500"
                    )}>
                        {subValue}
                    </span>
                </div>
            )}
        </div>
    );
}

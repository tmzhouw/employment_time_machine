'use client';

import { useState } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';
import { TownStat } from '@/lib/data';

interface RegionComparisonProps {
    data: TownStat[];
}

export function RegionComparison({ data }: RegionComparisonProps) {
    // Default to comparing top 3 towns by employees
    const [selectedTowns, setSelectedTowns] = useState<string[]>(
        data.slice(0, 3).map(t => t.name)
    );

    if (!data || data.length === 0) return null;

    // Filter to only selected towns for normalization
    const selectedData = data.filter(d => selectedTowns.includes(d.name));

    // Find max values from SELECTED towns only (so chart fills proportionally)
    const maxEmployees = Math.max(...selectedData.map(d => d.totalEmployees), 1);
    const maxDensity = Math.max(...selectedData.map(d => d.companyCount), 1);
    const maxShortage = Math.max(...selectedData.map(d => d.shortageCount), 1);
    const maxUrgency = Math.max(...selectedData.map(d => d.shortageRate), 0.1);
    const maxTurnover = Math.max(...selectedData.map(d => d.turnoverRate), 0.1);

    const subjects = [
        { key: 'scale', label: '用工规模', max: maxEmployees, unit: '人' },
        { key: 'density', label: '企业密度', max: maxDensity, unit: '家' },
        { key: 'shortage', label: '缺工人数', max: maxShortage, unit: '人' },
        { key: 'urgency', label: '紧缺度', max: maxUrgency, unit: '%' },
        { key: 'turnover', label: '流失率', max: maxTurnover, unit: '%' },
    ];

    // Transformation for Radar Chart
    // We store both normalized value (for chart) and original value (for tooltip)
    const radarData = subjects.map(subject => {
        const entry: any = { subject: subject.label, fullMark: 100, unit: subject.unit };

        selectedTowns.forEach(townName => {
            const town = data.find(d => d.name === townName);
            if (town) {
                let value = 0;
                switch (subject.key) {
                    case 'scale': value = town.totalEmployees; break;
                    case 'density': value = town.companyCount; break;
                    case 'shortage': value = town.shortageCount; break;
                    case 'urgency': value = town.shortageRate; break;
                    case 'turnover': value = town.turnoverRate; break;
                }

                // Store normalized value for the Chart DataKey
                entry[townName] = Math.min((value / (subject.max || 1)) * 100, 100);

                // Store original value for Tooltip
                entry[`${townName}_original`] = value;
            }
        });
        return entry;
    });

    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

    const toggleTown = (name: string) => {
        if (selectedTowns.includes(name)) {
            setSelectedTowns(selectedTowns.filter(t => t !== name));
        } else {
            if (selectedTowns.length >= 3) return; // Limit to 3
            setSelectedTowns([...selectedTowns, name]);
        }
    };

    // Custom Tooltip to show original values
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // payload contains the data points for the hovered subject
            // label is the subject name (e.g. "用工规模")
            const subjectInfo = subjects.find(s => s.label === label);
            const unit = subjectInfo?.unit || '';

            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 ring-1 ring-slate-900/5">
                    <h4 className="font-bold text-slate-900 mb-2">{label}</h4>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => {
                            const townName = entry.name;
                            const originalValue = entry.payload[`${townName}_original`];
                            // Format value: 1 decimal for %, integer for counts
                            const formattedValue = unit === '%'
                                ? Number(originalValue).toFixed(2)
                                : Math.round(Number(originalValue)).toLocaleString();

                            return (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                    <span className="text-slate-600">{townName}:</span>
                                    <span className="font-medium text-slate-900">
                                        {formattedValue}{unit}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">区域多维对比 (Radar)</h3>
                <p className="text-sm text-slate-500">选择乡镇进行对比（最多3个）</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Chart */}
                <div className="flex-1 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                            {selectedTowns.map((townName, index) => (
                                <Radar
                                    key={townName}
                                    name={townName}
                                    dataKey={townName}
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.2}
                                />
                            ))}
                            <Legend />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Selector */}
                <div className="w-full lg:w-48 space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">候选乡镇</h4>
                    {data.map(town => (
                        <button
                            key={town.name}
                            onClick={() => toggleTown(town.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedTowns.includes(town.name)
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            disabled={!selectedTowns.includes(town.name) && selectedTowns.length >= 3}
                        >
                            <span>{town.name}</span>
                            {selectedTowns.includes(town.name) && (
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[selectedTowns.indexOf(town.name) % colors.length] }} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

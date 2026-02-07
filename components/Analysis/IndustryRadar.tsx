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
import { IndustryStat } from '@/lib/data';

interface IndustryRadarProps {
    data: IndustryStat[];
}

export function IndustryRadar({ data }: IndustryRadarProps) {
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
        data.slice(0, 3).map(d => d.name)
    );

    if (!data || data.length === 0) return null;

    const selectedData = data.filter(d => selectedIndustries.includes(d.name));

    // Normalize against selected industries only
    const maxEmployees = Math.max(...selectedData.map(d => d.totalEmployees), 1);
    const maxCompanies = Math.max(...selectedData.map(d => d.companyCount), 1);
    const maxShortage = Math.max(...selectedData.map(d => d.shortageCount), 1);
    const maxUrgency = Math.max(...selectedData.map(d => d.shortageRate), 0.1);
    const maxTurnover = Math.max(...selectedData.map(d => d.turnoverRate), 0.1);
    const maxAvg = Math.max(...selectedData.map(d => d.avgEmployeesPerCompany), 1);

    const subjects = [
        { key: 'scale', label: '用工规模', max: maxEmployees, unit: '人' },
        { key: 'companies', label: '企业数量', max: maxCompanies, unit: '家' },
        { key: 'shortage', label: '缺工人数', max: maxShortage, unit: '人' },
        { key: 'urgency', label: '紧缺度', max: maxUrgency, unit: '%' },
        { key: 'turnover', label: '流失率', max: maxTurnover, unit: '%' },
        { key: 'avgSize', label: '企均规模', max: maxAvg, unit: '人' },
    ];

    const radarData = subjects.map(subject => {
        const entry: any = { subject: subject.label, fullMark: 100, unit: subject.unit };

        selectedIndustries.forEach(name => {
            const ind = data.find(d => d.name === name);
            if (ind) {
                let value = 0;
                switch (subject.key) {
                    case 'scale': value = ind.totalEmployees; break;
                    case 'companies': value = ind.companyCount; break;
                    case 'shortage': value = ind.shortageCount; break;
                    case 'urgency': value = ind.shortageRate; break;
                    case 'turnover': value = ind.turnoverRate; break;
                    case 'avgSize': value = ind.avgEmployeesPerCompany; break;
                }
                entry[name] = Math.min((value / (subject.max || 1)) * 100, 100);
                entry[`${name}_original`] = value;
            }
        });
        return entry;
    });

    const colors = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#ec4899'];

    const toggleIndustry = (name: string) => {
        if (selectedIndustries.includes(name)) {
            setSelectedIndustries(selectedIndustries.filter(i => i !== name));
        } else {
            if (selectedIndustries.length >= 3) return;
            setSelectedIndustries([...selectedIndustries, name]);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const subjectInfo = subjects.find(s => s.label === label);
            const unit = subjectInfo?.unit || '';
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 ring-1 ring-slate-900/5">
                    <h4 className="font-bold text-slate-900 mb-2">{label}</h4>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => {
                            const industryName = entry.name;
                            const originalValue = entry.payload[`${industryName}_original`];
                            const formattedValue = unit === '%'
                                ? Number(originalValue).toFixed(2)
                                : Math.round(Number(originalValue)).toLocaleString();
                            return (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                    <span className="text-slate-600">{industryName}:</span>
                                    <span className="font-medium text-slate-900">{formattedValue}{unit}</span>
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
                <h3 className="text-lg font-bold text-slate-900">行业健康度雷达</h3>
                <p className="text-sm text-slate-500">选择行业进行对比（最多3个）</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            {selectedIndustries.map((name, index) => (
                                <Radar
                                    key={name}
                                    name={name}
                                    dataKey={name}
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

                <div className="w-full lg:w-52 space-y-2 max-h-[380px] overflow-y-auto pr-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">候选行业</h4>
                    {data.map(ind => (
                        <button
                            key={ind.name}
                            onClick={() => toggleIndustry(ind.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedIndustries.includes(ind.name)
                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            disabled={!selectedIndustries.includes(ind.name) && selectedIndustries.length >= 3}
                        >
                            <span className="truncate">{ind.name}</span>
                            {selectedIndustries.includes(ind.name) && (
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[selectedIndustries.indexOf(ind.name) % colors.length] }} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

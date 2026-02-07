'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Factory, MapPin } from 'lucide-react';

export type ComparisonMode = 'industry' | 'town';

interface ComparisonSelectorProps {
    mode: ComparisonMode;
    onModeChange: (mode: ComparisonMode) => void;
    items: string[];
    selectedItems: string[];
    onSelectionChange: (items: string[]) => void;
    loading?: boolean;
}

export function ComparisonSelector({
    mode,
    onModeChange,
    items,
    selectedItems,
    onSelectionChange,
    loading = false
}: ComparisonSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter items based on search
    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(search.toLowerCase())
    );

    // Toggle item selection
    const toggleItem = (item: string) => {
        if (selectedItems.includes(item)) {
            onSelectionChange(selectedItems.filter(i => i !== item));
        } else {
            if (selectedItems.length >= 5) {
                alert('最多只能对比 5 个对象'); // Simple alert for now
                return;
            }
            onSelectionChange([...selectedItems, item]);
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => onModeChange('industry')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'industry'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Factory className="w-4 h-4" />
                    行业对比
                </button>
                <button
                    onClick={() => onModeChange('town')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'town'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <MapPin className="w-4 h-4" />
                    区域对比
                </button>
            </div>

            {/* Multi-Select Dropdown */}
            <div className="relative flex-1 w-full md:max-w-xl" ref={containerRef}>
                <div
                    className="flex flex-wrap gap-2 items-center min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-lg cursor-text focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
                    onClick={() => setOpen(true)}
                >
                    {selectedItems.length === 0 && !open && (
                        <span className="text-slate-400 text-sm">请选择{mode === 'industry' ? '行业' : '乡镇'}...</span>
                    )}

                    {selectedItems.map(item => (
                        <span
                            key={item}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${mode === 'industry'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}
                        >
                            {item}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(item);
                                }}
                                className="hover:bg-black/5 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}

                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
                        placeholder={selectedItems.length === 0 ? "" : "搜索..."}
                        onFocus={() => setOpen(true)}
                    />

                    <ChevronsUpDown className="w-4 h-4 text-slate-400 ml-auto" />
                </div>

                {/* Dropdown Menu */}
                {open && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-slate-100 max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-slate-500 text-sm">加载中...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">无匹配项</div>
                        ) : (
                            <div className="p-1">
                                {filteredItems.map(item => (
                                    <button
                                        key={item}
                                        onClick={() => toggleItem(item)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${selectedItems.includes(item)
                                                ? (mode === 'industry' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700')
                                                : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        {item}
                                        {selectedItems.includes(item) && (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

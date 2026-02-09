'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 no-print flex items-center justify-center group"
            title="打印报告"
            aria-label="Print Report"
        >
            <Printer className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium">
                打印报告
            </span>
        </button>
    );
}

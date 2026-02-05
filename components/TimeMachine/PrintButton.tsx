
'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors shadow-sm"
        >
            <Printer size={18} />
            Print Report (A4)
        </button>
    );
}

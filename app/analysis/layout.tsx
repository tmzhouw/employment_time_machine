'use client';

import AnalysisSidebar from '@/components/Analysis/Sidebar';

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen z-20">
                <AnalysisSidebar />
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-56">
                {/* Top Bar */}
                <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
                            <p className="text-sm text-slate-600 mt-1">深度挖掘用工数据，支持科学决策</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Global actions can be added here */}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

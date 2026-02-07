'use client';

import { NavBar } from '@/components/TimeMachine/NavBar';
import AnalysisSidebar from '@/components/Analysis/Sidebar';
import MobileNav from '@/components/Analysis/MobileNav';

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Global Navigation - Consistent with Homepage */}
            <NavBar />

            <div className="flex flex-1">
                {/* Sidebar - Sticky below NavBar - Hidden on Mobile */}
                <aside className="hidden md:block w-56 flex-shrink-0 relative z-10 transition-all">
                    <div className="sticky top-[76px] h-[calc(100vh-76px)]">
                        <AnalysisSidebar />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Mobile Navigation Tab Bar */}
                    <MobileNav />

                    {/* Page Title Bar - simplified as we have Global Nav now */}
                    <div className="bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-4 md:px-8 md:py-5 sticky top-[0px] md:top-[76px] z-10 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">数据分析工作台</h1>
                                <p className="text-sm text-gray-500 mt-1">深度挖掘产业用工效能，辅助精准决策</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

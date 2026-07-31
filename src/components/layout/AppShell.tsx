"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* 桌面版側欄 */}
      <div className="hidden h-full md:block">
        <Sidebar />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 瀏海／狀態列的高度，只有手機需要 */}
        <div className="shrink-0 md:hidden" style={{ height: "env(safe-area-inset-top)" }} />

        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

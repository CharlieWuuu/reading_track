"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { AuthButton } from "@/components/auth/AuthButton";
import { RefreshButton } from "./RefreshButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* 桌面版側欄 */}
      <div className="hidden h-full md:block">
        <Sidebar />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 手機版頂欄：只放品牌與帳號，導覽改在底部 */}
        <header
          className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-900 bg-white px-4 py-2 md:hidden"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <span className="text-base font-semibold tracking-tight">Reading Track</span>
          <div className="flex items-center gap-2">
            <RefreshButton compact />
            <AuthButton compact />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

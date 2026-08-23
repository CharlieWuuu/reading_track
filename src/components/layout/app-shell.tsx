"use client";

import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  authSlot,
}: {
  children: React.ReactNode;
  authSlot: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* 桌面版側欄 */}
      <div className="hidden h-full md:block">
        <Sidebar authSlot={authSlot} />
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 瀏海／狀態列的高度，只有手機需要 */}
        <div className="shrink-0 md:hidden" style={{ height: "env(safe-area-inset-top)" }} />

        {/* main 只負責版面與留白，捲動交給頁面裡的 PageBody，頁首才固定得住 */}
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 px-5 sm:p-4 md:gap-5 md:p-6">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

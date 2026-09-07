"use client";

import { BottomNav } from "./bottom-nav";
import { Masthead } from "./masthead";
import { Sidebar } from "./sidebar";

/**
 * 桌機是「全寬報頭 ＋ 側欄」：報頭橫跨整個寬度，側欄與內容排在它底下。
 * 手機還是底部導覽，報頭不出現——那一版另外收。
 */
export function AppShell({
  children,
  authSlot,
}: {
  children: React.ReactNode;
  authSlot: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* 瀏海／狀態列的高度，只有手機需要 */}
      <div className="shrink-0 md:hidden" style={{ height: "env(safe-area-inset-top)" }} />

      <div className="hidden shrink-0 md:block">
        <Masthead authSlot={authSlot} />
      </div>

      <div className="flex min-h-0 flex-1 md:gap-8 md:px-11 md:pt-5">
        <div className="hidden md:block md:self-stretch">
          <Sidebar />
        </div>

        {/* main 只負責版面與留白，捲動交給頁面裡的 PageBody，頁首才固定得住 */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-4 md:gap-5 md:p-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

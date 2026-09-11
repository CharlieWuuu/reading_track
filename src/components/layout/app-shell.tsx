"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { BottomNav } from "./bottom-nav";
import { Masthead } from "./masthead";
import { Sidebar } from "./sidebar";

/**
 * 桌機是「全寬報頭 ＋ 側欄」：報頭橫跨整個寬度，側欄與內容排在它底下。
 * 手機版型骨架（設計稿 Layout）：報頭不出現，站名交給底部導覽與系統列，
 * 每頁自己的 PageHeader 頂著標題、返回、動作。
 *
 * 沒登入時手機沒有底部導覽可以當入口（底部導覽指向讀不到的資料），
 * 這種情況才補一條迷你列給登入鍵用——僅未登入 + 手機同時成立時出現，
 * 登入後立刻讓位給底部導覽，不違背設計稿「報頭不出現」的原則。
 *
 * session 還在確認時，側欄與 children 一起不顯示——children 自己也會打 API，
 * 各自的 loading 步調不一樣，先讓側欄出現、內容才跳出來會很跳動。
 * 一起等，一起出現。
 */
export function AppShell({
  children,
  authSlot,
}: {
  children: React.ReactNode;
  authSlot: React.ReactNode;
}) {
  const { status } = useSession();
  const resolved = status !== "loading";
  const signedIn = status === "authenticated";
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <div className="flex h-full w-full flex-col">
      {/* 瀏海／狀態列的高度，只有手機需要 */}
      <div className="shrink-0 md:hidden" style={{ height: "env(safe-area-inset-top)" }} />

      <div className="hidden shrink-0 md:block">
        <Masthead authSlot={authSlot} />
      </div>

      {/* 手機未登入時的迷你入口：底部導覽要登入後才出現，這是唯一能點的登入按鈕 */}
      {resolved && !signedIn && (
        <div className="border-rule-strong flex shrink-0 items-center justify-end border-b px-4 py-2 md:hidden">
          <Link
            href="/login"
            className="bg-control-bg text-control-ink text-ui px-3 py-1.5 font-medium"
          >
            登入
          </Link>
        </div>
      )}

      <div className="flex min-h-0 flex-1 md:gap-8 md:px-11 md:pt-5">
        {signedIn && !collapsed && (
          <div className="mb-5 hidden md:block md:self-stretch">
            <Sidebar />
          </div>
        )}

        {/* main 只負責版面與留白，捲動交給頁面裡的 PageBody，頁首才固定得住 */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-4 md:gap-5 md:p-0">
          {resolved && children}
        </main>
      </div>

      {signedIn && <BottomNav />}
    </div>
  );
}

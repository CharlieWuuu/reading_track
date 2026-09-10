"use client";

import { useSession } from "next-auth/react";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { BottomNav } from "./bottom-nav";
import { Masthead } from "./masthead";
import { Sidebar } from "./sidebar";

/**
 * 桌機是「全寬報頭 ＋ 側欄」：報頭橫跨整個寬度，側欄與內容排在它底下。
 * 手機報頭一樣出現（含站名與登入鍵），側欄改走底部導覽。
 *
 * 沒登入就沒有清單導覽：側欄與底部列都指向讀不到的資料，兩者都只在
 * signedIn 時顯示。報頭則永遠都在——不管登入與否、不管手機桌機，
 * 站名與登入鍵都得看得到，否則沒有入口能登入。
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

      <div className="shrink-0">
        <Masthead authSlot={authSlot} />
      </div>

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

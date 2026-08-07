"use client";

import { useRef } from "react";
import { BottomNav } from "./BottomNav";
import { PullToRefresh } from "./PullToRefresh";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* 桌面版側欄 */}
      <div className="hidden h-full md:block">
        <Sidebar />
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <PullToRefresh scrollRef={mainRef} />

        {/* 瀏海／狀態列的高度，只有手機需要 */}
        <div className="shrink-0 md:hidden" style={{ height: "env(safe-area-inset-top)" }} />

        {/*
          內容區同時是捲動容器，而且刻意做成 flex 欄：

          - 一般的區塊捲動容器會把 padding-bottom 畫在原本的內容框底部，
            內容溢出時捲到底就沒有留白；flex 容器則會把它算進捲動範圍。
          - 頁面根元素用 flex-1（不是 h-full）就拿得到明確高度，
            月曆、書單那種「剛好一畫面」的版型才排得出來；內容變長時
            flex 項目會自己長高，多出來的部分照樣可以捲。
        */}
        <main
          ref={mainRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 md:gap-5 md:p-6"
        >
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

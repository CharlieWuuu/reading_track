"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 換頁就把抽屜收起來，不然點完連結選單還開著
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* 手機版頂欄 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-900 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="開啟選單"
          className="rounded p-1 text-gray-700 hover:bg-gray-100"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-base font-semibold tracking-tight">Reading Track</span>
      </header>

      {/* 手機版抽屜 */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="關閉選單"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-y-0 left-0 w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* 桌面版側欄 */}
      <div className="hidden h-full md:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

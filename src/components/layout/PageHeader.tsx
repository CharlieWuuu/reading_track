"use client";

import { useSession } from "next-auth/react";
import { AuthButton } from "@/components/auth/AuthButton";

/** 頁首與它下面那條線；兩個都是 main 的 flex 子元素，上下間距一律由 main 的 gap 決定 */
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  // 登入後帳號的入口都在設定頁；未登入時登入按鈕必須留著，不然手機沒有入口
  const showAuth = status !== "loading" && !session?.user;

  // 手機不顯示標題，這時候如果也沒有操作按鈕，整條頁首就只剩一條線——那就連線一起收起來
  const emptyOnMobile = !action && !showAuth;

  return (
    <>
      <div
        className={`shrink-0 flex-wrap items-center justify-between gap-2 md:gap-3 ${
          emptyOnMobile ? "hidden md:flex" : "flex"
        }`}
      >
        {/* 手機不顯示標題：底部導覽已經標出在哪一頁，把寬度讓給操作區 */}
        <h2 className="hidden whitespace-nowrap text-base font-semibold md:block">{title}</h2>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="min-w-0">{action}</div>
          {/* 手機的重新整理改用下拉手勢、帳號在設定頁；未登入時例外，不然沒有登入入口 */}
          {showAuth && (
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <AuthButton compact />
            </div>
          )}
        </div>
      </div>

      <div className={`h-px shrink-0 bg-gray-900 ${emptyOnMobile ? "hidden md:block" : ""}`} />
    </>
  );
}

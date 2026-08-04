"use client";

import { useSession } from "next-auth/react";
import { AuthButton } from "@/components/auth/AuthButton";

/**
 * 手機上不再另外做一條品牌列——app 的名稱由系統的標題列負責，
 * 省下的高度留給內容。
 */
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

  // 手機不顯示標題，這時候如果也沒有操作按鈕，整條頁首就只剩一條分隔線——
  // 那就整條不要出現，把高度讓給內容
  const emptyOnMobile = !action && !showAuth;

  return (
    <div
      className={`shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-900 pb-3 md:gap-3 ${
        emptyOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      {/* 手機不顯示標題：底部導覽已經標出在哪一頁，把寬度讓給操作區 */}
      <h2 className="hidden whitespace-nowrap text-base font-semibold md:block">{title}</h2>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <div className="min-w-0">{action}</div>
        {/*
          手機頂欄不放重新整理與帳號：重新整理改用下拉手勢（PullToRefresh），
          帳號移到設定頁——兩者頻率都低，不值得永久佔掉一條高度。
          未登入時例外，登入按鈕必須留著，不然手機上沒有入口。
        */}
        {showAuth && (
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <AuthButton compact />
          </div>
        )}
      </div>
    </div>
  );
}

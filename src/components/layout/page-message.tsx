"use client";

import Link from "next/link";

type PageMessageProps = {
  children: React.ReactNode;
  tone?: "muted" | "error";
  fill?: boolean; // 撐滿剩下的高度，讓訊息與正常內容佔一樣的空間
};

/** 頁面層級的訊息（載入中／未連接／空清單／錯誤），各頁長得一致。不畫框：它不是一則內容 */
export function PageMessage({ children, tone = "muted", fill = false }: PageMessageProps) {
  // API 回「請先登入」時光顯示文字沒有用，直接給可以按的登入入口
  if (typeof children === "string" && children.includes("請先登入")) {
    return (
      <div className="text-ui text-ink-muted flex w-full flex-col items-center gap-3 p-8 text-center">
        <span>{children}</span>
        <Link
          href="/login"
          className="rounded-control bg-control-bg text-control-ink px-3 py-1.5 text-sm font-medium"
        >
          前往登入
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`text-ui w-full p-8 text-center ${
        tone === "error" ? "text-danger" : "text-ink-muted"
      } ${fill ? "flex min-h-0 flex-1 items-center justify-center" : ""}`}
    >
      {children}
    </div>
  );
}

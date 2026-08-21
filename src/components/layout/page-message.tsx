"use client";

import { SignInPrompt } from "@/components/ui/sign-in-prompt";

type PageMessageProps = {
  children: React.ReactNode;
  tone?: "muted" | "error";
  fill?: boolean; // 撐滿剩下的高度，讓訊息與正常內容佔一樣的空間
};

/** 頁面層級的訊息框（載入中／未連接／空清單／錯誤），各頁長得一致 */
export function PageMessage({ children, tone = "muted", fill = false }: PageMessageProps) {
  // API 回「請先登入」時光顯示文字沒有用，直接給可以按的登入入口
  if (typeof children === "string" && children.includes("請先登入")) {
    return <SignInPrompt text={children} />;
  }

  return (
    <div
      className={`w-full rounded-lg bg-white p-8 text-center text-sm ${
        tone === "error" ? "text-red-600" : "text-gray-500"
      } ${fill ? "flex min-h-0 flex-1 items-center justify-center" : ""}`}
    >
      {children}
    </div>
  );
}

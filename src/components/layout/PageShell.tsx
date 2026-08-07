"use client";

import { PageHeader } from "@/components/layout/PageHeader";

/** 一頁的外框：滿版寬度、頁首、頁首與內容之間的間距 */
export function PageShell({
  title,
  action,
  /** 撐滿可用高度，給「一頁看完、不整頁捲」的版面 */
  fill = false,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  fill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex w-full flex-col gap-3 md:gap-5 ${fill ? "min-h-0 flex-1" : ""}`}
    >
      <PageHeader title={title} action={action} />
      {children}
    </div>
  );
}

/** 頁面層級的訊息框（載入中／未連接／空清單／錯誤），各頁長得一致 */
export function PageMessage({
  children,
  tone = "muted",
  fill = false,
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
  fill?: boolean;
}) {
  return (
    <div
      className={`w-full rounded-lg border bg-white p-8 text-center text-sm ${
        tone === "error" ? "text-red-600" : "text-gray-500"
      } ${fill ? "flex min-h-0 flex-1 items-center justify-center" : ""}`}
    >
      {children}
    </div>
  );
}

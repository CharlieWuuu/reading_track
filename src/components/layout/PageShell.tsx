"use client";

import { PageHeader } from "@/components/layout/PageHeader";

/** 各頁的內容寬度。名字用途取向，改版時才不用回頭數 max-w 是誰的 */
const WIDTH = {
  narrow: "max-w-md", // 個人資訊
  form: "max-w-3xl", // 表單、設定
  wide: "max-w-5xl", // 清單、月曆、統計
  full: "max-w-none", // 書籍紀錄：欄位多，整個寬度都要
} as const;

/**
 * 一頁的外框：置中、限寬、頁首、以及頁首與內容之間的間距。
 *
 * 這些原本在每一頁各寫一次（十九處），於是總有地方漏掉 w-full 或 gap——
 * 載入中、錯誤、未登入那些「順手寫一下」的狀態尤其容易漏。集中在這裡之後，
 * 那些狀態只要照樣包一層 PageShell，就不可能跟正常狀態長得不一樣。
 *
 * 間距一律靠父層 gap，不要在子元素上加單方向的 margin。
 */
export function PageShell({
  title,
  action,
  width = "wide",
  /** 撐滿可用高度：月曆、統計、表單那種「一頁看完、不整頁捲」的版面要開 */
  fill = false,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  width?: keyof typeof WIDTH;
  fill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-col gap-3 md:gap-5 ${WIDTH[width]} ${
        fill ? "min-h-0 flex-1" : ""
      }`}
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

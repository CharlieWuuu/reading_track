"use client";

import { splitTags } from "@/types/book";
import { TAG_TONES, TagTone } from "@/utils/tag-colors";

/**
 * 標籤徽章，整組同色，代表「這一格是哪一種分類」。
 *
 * 原本沒給 tone 時會退回逐個標籤配色，為此得自己去讀分類清單；
 * 但所有呼叫端都有給 tone，那條路沒人走，連帶讓 ui/ 這層多了一個資料依賴。
 */
export function TagList({
  values,
  tone,
  size = "md",
  wrap = true,
}: {
  values: Array<string | undefined>;
  /** 這組標籤屬於哪個欄位，同欄位永遠同色 */
  tone: TagTone;
  /** sm：標籤多的欄位（例如屬性）用小一號，一格才擠得下 */
  size?: "sm" | "md";
  /** false：擠在單行裡（例如文章列表），放不下的就讓外層裁掉 */
  wrap?: boolean;
}) {
  const items = values.flatMap((value) => splitTags(value));

  if (items.length === 0) return null;

  return (
    // shrink-0：這一盒不能被壓縮，否則裡面不縮的標籤會溢出去疊到隔壁那組
    <div className={`flex shrink-0 gap-1.5 ${wrap ? "flex-wrap" : "flex-nowrap"}`}>
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          /* 高度寫死，跟同一行的文字對得起來 */
          className={`inline-flex shrink-0 items-center rounded leading-none font-medium ${
            size === "sm" ? "h-4 px-1.5 text-[10px]" : "h-5 px-1.5 text-[11px]"
          } ${TAG_TONES[tone]}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

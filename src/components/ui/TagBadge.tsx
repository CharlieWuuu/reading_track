"use client";

import { TAG_TONES, tagColorClass, tagOrder, TagTone } from "@/lib/tagColors";
import { useCategories } from "@/lib/useCategories";
import { ReadingStatus, splitTags } from "@/types/book";

/**
 * 閱讀狀態是有順序的進度，不是平行的分類，所以用同一個色相的三個階，
 * 而不是三種顏色。實心底只有狀態在用，才不會跟同色系的分類標籤看混。
 */
export const STATUS_STYLES: Record<ReadingStatus, string> = {
  想讀: "bg-[#EAE3D8] text-[#5C4A3D]",
  閱讀中: "bg-[#B07D2B] text-white",
  // 已讀完是多數狀態，給最淡的一階；同色系但幾乎不出聲＝「這件事結束了」
  已讀完: "bg-[#F5F1EA] text-[#A2957F]",
};

export function StatusBadge({ status }: { status: ReadingStatus }) {
  return (
    <span
      className={`inline-block shrink-0 rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES.想讀}`}
    >
      {status}
    </span>
  );
}

/**
 * 標籤徽章。給了 tone 就整組同色，代表「這一格是哪一種分類」；
 * 沒給 tone（例如文章的自由標籤）才退回逐個標籤配色（見 lib/tagColors）。
 */
export function TagList({
  values,
  tone,
  size = "md",
  wrap = true,
}: {
  values: Array<string | undefined>;
  /** 這組標籤屬於哪個欄位，同欄位永遠同色 */
  tone?: TagTone;
  /** sm：標籤多的欄位（例如屬性）用小一號，一格才擠得下 */
  size?: "sm" | "md";
  /** false：擠在單行裡（例如文章列表），放不下的就讓外層裁掉 */
  wrap?: boolean;
}) {
  const { categories } = useCategories();
  const order = tagOrder(categories);
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
          } ${tone ? TAG_TONES[tone] : tagColorClass(item, order)}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

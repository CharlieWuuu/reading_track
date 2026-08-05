"use client";

import { useCategories } from "@/lib/useCategories";
import { tagColorClass, tagOrder } from "@/lib/tagColors";
import { splitTags } from "@/types/book";

/**
 * 標籤徽章。顏色由標籤本身決定（見 lib/tagColors），
 * 所以書單、文章列表、詳細檢視裡的同一個標籤永遠是同一個顏色。
 */
export function TagList({
  values,
  size = "md",
  wrap = true,
}: {
  values: Array<string | undefined>;
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
    <div className={`flex gap-1.5 ${wrap ? "flex-wrap" : "flex-nowrap"}`}>
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          /* 高度寫死，跟同一行的文字對得起來 */
          className={`inline-flex shrink-0 items-center rounded font-medium leading-none ${
            size === "sm" ? "h-4 px-1.5 text-[10px]" : "h-5 px-1.5 text-[11px]"
          } ${tagColorClass(item, order)}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

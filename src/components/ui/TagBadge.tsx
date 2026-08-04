"use client";

import { useCategories } from "@/lib/useCategories";
import { tagColorClass, tagOrder } from "@/lib/tagColors";
import { splitTags } from "@/types/book";

/**
 * 標籤徽章。顏色由標籤本身決定（見 lib/tagColors），
 * 所以書單、文章列表、詳細檢視裡的同一個標籤永遠是同一個顏色。
 */
export function TagList({ values }: { values: Array<string | undefined> }) {
  const { categories } = useCategories();
  const order = tagOrder(categories);
  const items = values.flatMap((value) => splitTags(value));

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tagColorClass(item, order)}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

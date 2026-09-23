"use client";

import { DEFAULT_VIEWS } from "@/config/kind-views";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";
import { BookViewMode } from "@/stores/use-book-view-store";

/**
 * 某個類型有哪幾種看法。書籍、文章與所有自訂類型走同一支——
 * 檢視清單本來寫死在那兩支頁面檔裡，所以只有它們有切換鈕。
 *
 * 還在載入時先給預設的兩種，選單不會閃一下才出現。
 */
export function useKindViews(group: KindGroup, slug: string): BookViewMode[] {
  const { kinds } = useKinds();
  const kind = kinds.find((item) => item.group === group && item.slug === slug);
  return kind?.views ?? DEFAULT_VIEWS;
}

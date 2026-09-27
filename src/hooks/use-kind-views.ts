"use client";

import { DEFAULT_VIEWS, viewsOfKind } from "@/config/kind-views";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";
import { BookViewMode } from "@/stores/use-book-view-store";

/**
 * 某個類型有哪幾種檢視。書籍、文章與所有自訂類型走同一支——
 * 檢視清單本來寫死在那兩支頁面檔裡，所以只有它們有切換鈕。
 *
 * 統計是算出來的：勾到的模組畫得出圖才有它。還在載入時先給預設的兩種，
 * 選單不會閃一下才出現。
 */
export function useKindViews(group: KindGroup, slug: string): BookViewMode[] {
  const { kinds } = useKinds();
  const kind = kinds.find((item) => item.group === group && item.slug === slug);
  if (!kind) return DEFAULT_VIEWS;
  return viewsOfKind(
    kind.views,
    kind.modules.map((module) => module.key),
  );
}

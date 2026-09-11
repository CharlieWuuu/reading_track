"use client";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { useUrlParams } from "@/hooks/use-url-param";
import { GroupViewMode, isGroupViewMode, useGroupViewStore } from "@/stores/use-group-view-store";

/**
 * 堆概覽頁看哪一種：網址說了算，沒指定時沿用上次的選擇。
 *
 * 手機一律概覽——表格橫向捲不完，一格也看不清楚。回到桌機還是上次那個，
 * 所以只蓋住回傳值，不寫回 store。
 */
export function useGroupView(): GroupViewMode {
  const isMobile = useIsMobile();
  const { searchParams } = useUrlParams();
  const { view: savedView } = useGroupViewStore();
  const urlView = searchParams.get("view");

  if (isMobile) return "overview";
  return isGroupViewMode(urlView) ? urlView : savedView;
}

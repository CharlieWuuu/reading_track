"use client";

import { useUrlParams } from "@/hooks/use-url-param";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";

/** 檢視方式以網址為準，重新整理或分享連結才回得到同一個畫面 */
export function useBookView() {
  const { searchParams } = useUrlParams();
  const { view: savedView } = useBookViewStore();
  const urlView = searchParams.get("view");
  return isBookViewMode(urlView) ? urlView : savedView;
}

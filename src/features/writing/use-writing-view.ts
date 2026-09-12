"use client";

import { isWritingView, useWritingViewStore, WritingView } from "@/features/writing/views";
import { useUrlParams } from "@/hooks/use-url-param";

/** 書寫看哪一種：網址說了算，沒指定時沿用上次的選擇 */
export function useWritingView(): WritingView {
  const { searchParams } = useUrlParams();
  const savedView = useWritingViewStore((s) => s.view);
  const urlView = searchParams.get("view");
  return isWritingView(urlView) ? urlView : savedView;
}

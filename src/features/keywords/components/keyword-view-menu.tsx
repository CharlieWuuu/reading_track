"use client";

import { SelectMenu } from "@/components/ui/controls";
import { KEYWORD_VIEWS, useKeywordView } from "@/features/keywords/components/keywords-section";

/** 關鍵字的四種看法，收在頁首那顆「顯示方式」裡 */
export function KeywordViewMenu() {
  const { view, setView } = useKeywordView();
  return (
    <SelectMenu iconOnly label="顯示方式" items={KEYWORD_VIEWS} value={view} onChange={setView} />
  );
}

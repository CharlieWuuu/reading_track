"use client";

import { useEffect } from "react";
import { Newspaper, Rows3 } from "lucide-react";
import { SelectMenu } from "@/components/ui/controls";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useUrlParams } from "@/hooks/use-url-param";
import { GroupViewMode, isGroupViewMode, useGroupViewStore } from "@/stores/use-group-view-store";

const ITEMS = [
  {
    key: "overview" as const,
    label: "概覽",
    Icon: () => <Newspaper size={16} strokeWidth={1.5} />,
  },
  { key: "table" as const, label: "表格", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
];

/**
 * 堆概覽頁首的概覽／表格切換。網址說了算，沒指定時沿用上次的選擇——跟書籍那顆同一套規則。
 *
 * 手機不畫也不同步網址：那邊一律看概覽（見 useGroupView）。只用 CSS 藏起來不夠，
 * 元件還掛著就照樣把上次選的 view 寫回網址，回到桌機就變成表格。
 */
export function GroupViewMenu() {
  const isMobile = useIsMobile();
  const { view: savedView, setView: saveView } = useGroupViewStore();
  const { searchParams, setParams } = useUrlParams();
  const urlView = searchParams.get("view");
  const view = isGroupViewMode(urlView) ? urlView : savedView;

  useEffect(() => {
    if (!isMobile && urlView !== view) setParams({ view });
  }, [isMobile, urlView, view, setParams]);

  function select(next: GroupViewMode) {
    saveView(next);
    setParams({ view: next });
  }

  if (isMobile) return null;

  return <SelectMenu bare label="顯示方式" items={ITEMS} value={view} onChange={select} />;
}

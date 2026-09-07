"use client";

import { useEffect } from "react";
import { LayoutGrid, Newspaper, Rows3 } from "lucide-react";
import { SelectMenu } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";
import {
  BOOK_VIEW_MODES,
  BookViewMode,
  isBookViewMode,
  useBookViewStore,
} from "@/stores/use-book-view-store";

const ALL_ITEMS = {
  overview: { label: "概覽", Icon: () => <Newspaper size={16} strokeWidth={1.5} /> },
  table: { label: "表格", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
  card: { label: "書封", Icon: () => <LayoutGrid size={16} strokeWidth={1.5} /> },
} as const;

/**
 * cardLabel：書籍那邊卡片就是書封牆，文章沒有封面，叫「卡片」比較誠實。
 * modes：概覽只有書籍畫得出來（要封面、要月份分組），文章那頁不給這個選項。
 */
export function BookViewMenu({
  cardLabel = "書封",
  modes = BOOK_VIEW_MODES,
}: {
  cardLabel?: string;
  modes?: BookViewMode[];
}) {
  const items = modes.map((key) => ({
    key,
    label: key === "card" ? cardLabel : ALL_ITEMS[key].label,
    Icon: ALL_ITEMS[key].Icon,
  }));

  const { view: savedView, setView: saveView } = useBookViewStore();
  const { searchParams, setParams } = useUrlParams();
  const urlView = searchParams.get("view");
  // 網址說了算；沒指定時沿用上次的選擇
  const saved = isBookViewMode(urlView) ? urlView : savedView;
  // 這一頁畫不出來的檢視就退回第一個，選單不會指向一個不在清單裡的值
  const view = modes.includes(saved) ? saved : modes[0];

  // 網址沒帶 view 就補上目前這個（即使是預設值），讓網址永遠說得出現在在看什麼
  useEffect(() => {
    if (urlView !== view) setParams({ view });
  }, [urlView, view, setParams]);

  function select(next: BookViewMode) {
    saveView(next);
    // 一頁裝得下幾本會跟著檢視方式變，舊頁碼沒有意義，順手清掉
    setParams({ view: next, page: null });
  }

  return <SelectMenu iconOnly label="顯示方式" items={items} value={view} onChange={select} />;
}

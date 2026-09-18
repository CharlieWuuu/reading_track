"use client";

import { ChartPie, Newspaper, Rows3 } from "lucide-react";
import { SelectMenu } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";
import { BookViewMode, isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";

const ALL_ITEMS = {
  overview: { label: "概覽", Icon: () => <Newspaper size={16} strokeWidth={1.5} /> },
  table: { label: "表格", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
  card: { label: "卡片", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
  stats: { label: "統計", Icon: () => <ChartPie size={16} strokeWidth={1.5} /> },
} as const;

/**
 * 類型頁的顯示方式。清單長什麼樣各類型不同（概覽、表格、卡片），
 * 但「統計」是每一種都有的——勾了哪些模組決定畫哪幾張圖。
 *
 * modes 由頁面給：畫得出來的才列，不列一個選了會空白的選項。
 * 預設只有清單與統計，通用類型頁走這條。
 *
 * 狀態共用 use-book-view-store：從書籍切到單字時「我在看統計」該跟著走，
 * 不是每一種類型各記各的。
 */
export function KindViewMenu({
  modes = ["overview", "stats"],
  overviewLabel = "清單",
}: {
  modes?: readonly BookViewMode[];
  /** 通用清單就叫「清單」；有報紙式概覽的（單字）叫「概覽」 */
  overviewLabel?: string;
}) {
  const items = modes.map((key) => ({
    key,
    label: key === "overview" ? overviewLabel : ALL_ITEMS[key].label,
    Icon: ALL_ITEMS[key].Icon,
  }));

  const { view: savedView, setView: saveView } = useBookViewStore();
  const { searchParams, setParams } = useUrlParams();
  const urlView = searchParams.get("view");
  const saved = isBookViewMode(urlView) ? urlView : savedView;
  // 這一頁畫不出來的就退回第一個，選單不會指向一個不在清單裡的值
  const view = modes.includes(saved) ? saved : modes[0];

  function select(next: BookViewMode) {
    saveView(next);
    setParams({ view: next });
  }

  return <SelectMenu bare label="顯示方式" items={items} value={view} onChange={select} />;
}

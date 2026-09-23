"use client";

import { useEffect } from "react";
import { ChartPie, LayoutGrid, Newspaper, Rows3 } from "lucide-react";
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
  card: { label: "卡片", Icon: () => <LayoutGrid size={16} strokeWidth={1.5} /> },
  stats: { label: "統計", Icon: () => <ChartPie size={16} strokeWidth={1.5} /> },
} as const;

/**
 * 這一頁有幾種看法的切換選單。書籍、文章、片段與所有自訂類型共用一支。
 *
 * modes 從類型來（kinds.views），不寫在頁面檔裡——本來書籍與文章各寫一份清單，
 * 所以只有那兩種有切換鈕，自訂類型點進去永遠只有一種看法。
 *
 * cardLabel：書籍那邊卡片就是書封牆，叫「書封」比較準；其餘一律「卡片」。
 *
 * 狀態共用 use-book-view-store：從書籍切到單字時「我在看統計」該跟著走，
 * 不是每一種類型各記各的。
 */
export function KindViewMenu({
  cardLabel,
  modes = BOOK_VIEW_MODES,
}: {
  cardLabel?: string;
  modes?: readonly BookViewMode[];
}) {
  const items = modes.map((key) => ({
    key,
    label: key === "card" && cardLabel ? cardLabel : ALL_ITEMS[key].label,
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
    // 一頁裝得下幾本會跟著檢視方式變，舊頁碼沒有意義，順手清掉。
    // 概覽會把在讀／想讀／讀完排在同一頁，狀態篩選對它不生效，網址上留著會誤導
    setParams({
      view: next,
      page: null,
      ...(next === "overview" ? { status: null } : {}),
    });
  }

  return <SelectMenu bare label="顯示方式" items={items} value={view} onChange={select} />;
}

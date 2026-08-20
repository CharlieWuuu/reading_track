"use client";

import { useEffect } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { useUrlParams } from "@/hooks/use-url-param";
import { BookViewMode, isBookViewMode, useBookViewStore } from "@/stores/useBookViewStore";

/** cardLabel：書籍那邊卡片就是書封牆，文章沒有封面，叫「卡片」比較誠實 */
export function BookViewToggle({ cardLabel = "書封" }: { cardLabel?: string }) {
  const OPTIONS: Array<{ id: BookViewMode; label: string; Icon: () => React.ReactElement }> = [
    { id: "table", label: "表格", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
    { id: "card", label: cardLabel, Icon: () => <LayoutGrid size={16} strokeWidth={1.5} /> },
  ];

  const { view: savedView, setView: saveView } = useBookViewStore();
  const { searchParams, setParams } = useUrlParams();
  const urlView = searchParams.get("view");
  // 網址說了算；沒指定時沿用上次的選擇
  const view = isBookViewMode(urlView) ? urlView : savedView;

  // 網址沒帶 view 就補上目前這個（即使是預設值），讓網址永遠說得出現在在看什麼
  useEffect(() => {
    if (!isBookViewMode(urlView)) setParams({ view });
  }, [urlView, view, setParams]);

  function select(next: BookViewMode) {
    saveView(next);
    // 一頁裝得下幾本會跟著檢視方式變，舊頁碼沒有意義，順手清掉
    setParams({ view: next, page: null });
  }

  return (
    <div className="inline-flex h-8 items-center rounded border border-gray-300 p-0.5 md:h-9">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => select(option.id)}
          aria-pressed={view === option.id}
          aria-label={option.label}
          title={option.label}
          className={`flex h-full items-center rounded px-1.5 ${
            view === option.id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          <option.Icon />
        </button>
      ))}
    </div>
  );
}

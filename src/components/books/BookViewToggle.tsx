"use client";

import { BookViewMode, useBookViewStore } from "@/store/useBookViewStore";
import { useUrlParams } from "@/lib/useUrlParam";

const OPTIONS: Array<{ id: BookViewMode; label: string; Icon: () => React.ReactElement }> = [
  {
    id: "table",
    label: "表格",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "card",
    label: "書封",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2.5" width="5" height="5" rx="1" />
        <rect x="9" y="2.5" width="5" height="5" rx="1" />
        <rect x="2" y="8.5" width="5" height="5" rx="1" />
        <rect x="9" y="8.5" width="5" height="5" rx="1" />
      </svg>
    ),
  },
];

/** 檢視切換：放在頁首那一列，不再另外佔一整行 */
export function BookViewToggle() {
  const { view: savedView, setView: saveView } = useBookViewStore();
  const { searchParams, setParams } = useUrlParams();
  const urlView = searchParams.get("view");
  // 網址說了算；沒指定時沿用上次的選擇
  const view = urlView === "card" || urlView === "table" ? urlView : savedView;

  function select(next: BookViewMode) {
    saveView(next);
    // 一頁裝得下幾本會跟著檢視方式變，舊頁碼沒有意義，順手清掉
    setParams({ view: next, page: null });
  }

  return (
    <div className="inline-flex rounded border border-gray-300 p-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => select(option.id)}
          aria-pressed={view === option.id}
          aria-label={option.label}
          title={option.label}
          className={`rounded p-1.5 ${
            view === option.id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          <option.Icon />
        </button>
      ))}
    </div>
  );
}

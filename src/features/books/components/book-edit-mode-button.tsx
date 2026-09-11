"use client";

import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 表格檢視的編輯模式總開關。放在頁首（搜尋框右邊、檢視方式選單左邊），
 * 狀態走網址參數（edit=1）——BookTable 讀同一個參數，兩邊不用另外接線。
 */
export function BookEditModeButton() {
  const { searchParams, setParams } = useUrlParams();
  const editAll = searchParams.get("edit") === "1";

  return (
    <button
      type="button"
      onClick={() => setParams({ edit: editAll ? null : "1" })}
      className={`rounded-control shrink-0 border px-2 py-1 text-xs font-medium ${
        editAll
          ? "border-accent text-accent"
          : "text-ink-muted hover:bg-control-ghost-hover border-transparent"
      }`}
    >
      {editAll ? "完成編輯" : "編輯模式"}
    </button>
  );
}

"use client";

import { useUrlParams } from "@/lib/useUrlParam";

export type BookFormTab = "book" | "tags" | "excerpt" | "notes";

/**
 * 欄位多到一頁看不完，照「這東西是什麼」分頁：
 * 書籍是出版社定的事實、標記是自己貼上去的、摘錄是從書裡抄出來的、筆記是自己寫的。
 */
const TABS: { key: BookFormTab; label: string }[] = [
  { key: "book", label: "書籍" },
  { key: "tags", label: "標記" },
  { key: "excerpt", label: "摘錄" },
  { key: "notes", label: "筆記" },
];

const styles = {
  // 只佔自己的寬度，窄螢幕放不下時才在自己裡面橫捲
  bar: "flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-1",
  tab: "shrink-0 rounded px-2.5 py-1 text-sm font-medium whitespace-nowrap md:px-3 md:py-1.5",
  active: "bg-gray-900 text-white",
  idle: "text-gray-500 hover:bg-gray-100",
};

/**
 * 看哪一頁寫在網址上，重新整理或分享連結都回得到同一個分頁；預設書籍。
 * 分頁列在頁首、表單在下面，兩邊各自呼叫這個 hook 讀同一個參數。
 */
export function useBookFormTab() {
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: BookFormTab = TABS.some((t) => t.key === param) ? (param as BookFormTab) : "book";
  const setTab = (next: BookFormTab) => setParams({ tab: next === "book" ? null : next });
  return { tab, setTab };
}

/** 表單的分頁列，放在頁首的操作區 */
export function BookFormTabs() {
  const { tab, setTab } = useBookFormTab();

  return (
    <div className={styles.bar}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setTab(t.key)}
          className={`${styles.tab} ${tab === t.key ? styles.active : styles.idle}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

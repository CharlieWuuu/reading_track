"use client";

import { BookCover } from "@/components/ui/book-cover";
import type { RecordRow } from "@/lib/db/queries/catalog";

const styles = {
  panel:
    "absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-surface border bg-white py-1 shadow-lg",
  item: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  title: "min-w-0 flex-1 truncate",
  meta: "shrink-0 text-xs text-gray-400 tabular-nums",
};

/**
 * 打標題時從同類型已經完成的那些裡面找。
 *
 * 再讀一次的時候，十幾個欄位有十幾個跟上次一樣——與其重打或重查，
 * 不如直接帶上次那筆。只列完成的：還在進行中的那幾筆本來就在清單上，
 * 再新增一次多半是手滑。
 */
export function RepeatSuggestions({
  rows,
  query,
  onPick,
}: {
  rows: RecordRow[];
  query: string;
  onPick: (row: RecordRow) => void;
}) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const matches = rows
    .filter((row) => row.statusKey === "done" && row.title.toLowerCase().includes(q))
    .slice(0, 5);

  if (matches.length === 0) return null;

  return (
    <div className={styles.panel}>
      {matches.map((row) => (
        <button key={row.id} type="button" onClick={() => onPick(row)} className={styles.item}>
          <BookCover url={row.coverUrl} title={row.title} size="sm" />
          <span className={styles.title}>{row.title}</span>
          {/* 完成日期用來分辨同名多筆：同一本讀兩次，看日期就知道挑哪一筆 */}
          <span className={styles.meta}>{row.endDate ? `${row.endDate} 完成` : "完成過"}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { useEntries } from "@/lib/useEntries";

const styles = {
  wrap: "flex min-h-0 flex-col gap-1",
  label: "flex shrink-0 items-center gap-1.5 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  list: "flex min-h-0 flex-1 flex-col divide-y overflow-y-auto rounded border",
  row: "flex flex-col gap-0.5 px-3 py-2 hover:bg-gray-50",
  title: "truncate text-sm",
  meta: "truncate text-xs text-gray-400",
  empty: "px-3 py-2 text-xs text-gray-400",
  add: "shrink-0 rounded border px-3 py-1.5 text-center text-sm font-medium hover:bg-gray-50",
};

/**
 * 這本書／這篇文章底下的紀事。
 *
 * 心得記在紀事那邊而不是這一列上，一本書就可以有很多則——讀前三章寫一則、
 * 讀完再寫一則，是兩個想法而不是同一則的編輯。
 */
export function RelatedEntries({
  sourceId,
  sourceTitle,
}: {
  sourceId: string;
  sourceTitle: string;
}) {
  const { entries } = useEntries();
  const mine = entries.filter((e) => e.sourceId && e.sourceId === sourceId);

  const query = new URLSearchParams({ sourceId, sourceTitle, kind: "心得" });

  return (
    <div className={styles.wrap}>
      <label className={styles.label}>
        <PenLine size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
        紀事
        <span className={styles.hint}>心得寫在這裡，一本書可以有很多則</span>
      </label>

      <div className={styles.list}>
        {mine.length === 0 ? (
          <p className={styles.empty}>還沒有寫過</p>
        ) : (
          mine.map((e) => (
            <Link key={e.id} href={`/entries/${e.id}/edit`} className={styles.row}>
              <span className={styles.title}>{e.title}</span>
              <span className={styles.meta}>
                {[e.date, e.kind].filter(Boolean).join(" · ")}
                {e.note && ` · ${e.note.split(/\r?\n/)[0]}`}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* 帶著延伸自跳過去，不用到了那邊再選一次 */}
      <Link href={`/entries/new?${query}`} className={styles.add}>
        寫一則心得
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { writingEditHref } from "@/config/routes";
import { useWritings } from "@/hooks/use-writings";

const styles = {
  wrap: "flex min-h-0 flex-col gap-1",
  label: "flex shrink-0 items-center gap-1.5 text-sm font-medium",
  list: "flex min-h-0 flex-1 flex-col divide-y overflow-y-auto rounded-control border",
  row: "flex flex-col gap-0.5 px-3 py-2 hover:bg-gray-50",
  // 標題與時間同一行：時間靠右，長標題自己截斷，不擠掉日期
  head: "flex min-w-0 items-baseline gap-2",
  title: "min-w-0 flex-1 truncate text-sm",
  date: "shrink-0 text-xs text-gray-400 tabular-nums",
  excerpt: "truncate text-xs text-gray-400",
  empty: "px-3 py-2 text-xs text-gray-400",
  actions: "flex shrink-0 items-center gap-2",
  write:
    "rounded-control bg-control-bg text-control-ink px-3 py-1.5 text-sm font-medium hover:bg-control-bg-hover",
};

/**
 * 這本書／這篇文章底下的書寫。
 *
 * 心得記在書寫那邊而不是這一列上，一本書就可以有很多則——讀前三章寫一則、
 * 讀完再寫一則，是兩個想法而不是同一則的編輯。
 *
 * 這裡只列出已經寫過的、以及一顆去寫新的一則的按鈕：心得要填的欄位（日期、
 * 類型、關鍵字）在書寫頁都有，在書籍頁再擺一個小框等於同一件事兩套入口。
 * 存檔與跳頁由父層那張表單處理，這支不碰 I/O。
 */
export function RelatedWriting({ sourceId, onWrite }: { sourceId: string; onWrite: () => void }) {
  const { writings } = useWritings();
  const mine = writings.filter((e) => e.sourceId && e.sourceId === sourceId);

  return (
    <div className={styles.wrap}>
      <label className={styles.label}>
        <PenLine size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
        書寫
      </label>

      <div className={styles.list}>
        {mine.length === 0 ? (
          <p className={styles.empty}>還沒有寫過</p>
        ) : (
          mine.map((e) => (
            <Link key={e.id} href={writingEditHref(e.id)} className={styles.row}>
              <div className={styles.head}>
                <span className={styles.title}>{e.title}</span>
                {e.date && <span className={styles.date}>{e.date}</span>}
              </div>
              {/* 類型不畫：這一區底下的每一則都是同一種，標了也分不出誰是誰 */}
              <span className={styles.excerpt}>{e.note.split(/\r?\n/)[0]}</span>
            </Link>
          ))
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onWrite} className={styles.write}>
          寫一則心得
        </button>
      </div>
    </div>
  );
}

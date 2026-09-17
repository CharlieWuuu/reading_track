"use client";

import Link from "next/link";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { FragmentRow } from "@/lib/db/queries/catalog";
import { splitLines, splitTags } from "@/types/book";
import { Writing } from "@/types/writing";
import { whenLabel } from "@/utils/date";
import { imageSrc } from "@/utils/image-key";
import { fragmentHref } from "@/utils/overview-items";
import { tagColorClass } from "@/utils/tag-colors";

/** 書寫那張表的一筆 → 這一列要的形狀 */
export const writingThreadRow = (w: Writing) => ({
  href: `/writings/writing/${w.id}`,
  title: w.title,
  topic: w.topic || w.kindName,
  note: w.note,
  date: w.endDate || w.createdAt,
  keywords: splitLines(w.keywords),
  coverUrl: w.coverUrl || undefined,
});

/** 片段那張表的一筆（書寫 group 也走這張）→ 這一列要的形狀 */
export const fragmentThreadRow = (row: FragmentRow) => ({
  href: fragmentHref(row),
  title: row.title,
  topic: row.kindName,
  note: row.body || row.note,
  date: row.date ?? row.createdAt,
  keywords: splitTags(row.tags),
  coverUrl: row.coverUrl || undefined,
});

const styles = {
  row: "flex w-full min-w-0 items-start gap-3 text-left",
  // 有圖沒圖佔一樣寬，右邊那欄的起點才會對齊成一直線
  avatar: "flex size-7 shrink-0 items-center justify-center",
  cover: "size-7 shrink-0 rounded-full object-cover",
  // 沒有封面時用主題的第一個字當頭像
  initial: "flex size-7 items-center justify-center rounded-full text-xs font-medium",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  head: "flex w-full min-w-0 items-baseline gap-2",
  title: "min-w-0 truncate text-sm font-medium",
  topic: "shrink-0 rounded-control px-1 py-px text-[10px]",
  time: "ml-auto shrink-0 text-[11px] text-gray-400 tabular-nums",
  // 整塊是連結，但不做 hover：一路往下讀的時候，滑鼠掃過一列就亮一列很吵
  noteLink: "flex w-full min-w-0 flex-col gap-1",
  note: "w-full min-w-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-700",
  foot: "flex w-full min-w-0 flex-wrap items-center gap-1",
  tag: "rounded-control bg-gray-100 px-1 py-px text-[10px] text-gray-500 hover:bg-gray-200",
};

/** 一欄到底：這是一路往下讀的流，不是卡片牆，不分欄 */
export const WRITING_THREAD_GRID = "flex flex-col gap-6";

type WritingThreadRowProps = {
  href: string;
  title: string;
  topic: string; // 頭像與色塊看這個：書寫用 topic，片段那邊用類型名
  note: string;
  date: string; // 空的就不顯示時間
  keywords: readonly string[];
  coverUrl?: string;
};

/**
 * 書寫的一則：左邊一張小圖講來源，右邊標題、整段內文、關鍵字。
 *
 * 內文不截斷——內文才是主體，摺在「更多」後面等於每一則都要多按一次
 * 才知道值不值得讀。
 *
 * 吃攤平過的形狀，不綁 Writing 或 FragmentRow——三個書寫頁資料來源不同，
 * 各自轉成這個介面就共用同一種畫法。
 */
export function WritingThreadRow({
  href,
  title,
  topic,
  note,
  date,
  keywords,
  coverUrl,
}: WritingThreadRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.avatar}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc(coverUrl)} alt="" loading="lazy" className={styles.cover} />
        ) : (
          topic && (
            <span className={`${styles.initial} ${tagColorClass(topic, [])}`}>{topic[0]}</span>
          )
        )}
      </div>

      <div className={styles.body}>
        {/* 標題連同內文整塊是連結：點哪裡都是進詳情頁 */}
        <Link href={href} className={styles.noteLink}>
          <span className={styles.head}>
            <span className={styles.title}>{title || note}</span>
            {topic && (
              <span className={`${styles.topic} ${tagColorClass(topic, [])}`}>{topic}</span>
            )}
            {date && <span className={styles.time}>{whenLabel(date)}</span>}
          </span>
          {note.trim() && <span className={styles.note}>{note}</span>}
        </Link>

        {keywords.length > 0 && (
          <div className={styles.foot}>
            {keywords.map((name) => (
              <KeywordTag key={name} name={name} className={styles.tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

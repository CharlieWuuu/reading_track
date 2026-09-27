"use client";

import Link from "next/link";
import { KeywordTag } from "@/components/ui/keyword-tag";
import { CardData } from "@/utils/card-data";
import { whenLabel } from "@/utils/date";
import { imageSrc } from "@/utils/image-key";
import { tagColorClass } from "@/utils/tag-colors";

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
export const THREAD_GRID = "flex flex-col gap-6";

/**
 * 書寫的一則：左邊一張小圖講來源，右邊標題、整段內文、關鍵字。
 *
 * 內文不截斷——內文才是主體，摺在「更多」後面等於每一則都要多按一次
 * 才知道值不值得讀。
 *
 * 吃攤平過的 CardData，不綁資料表——紀錄、片段、書寫都能畫成這樣，
 * 選哪一種由類型的卡片樣式決定（整則）。
 */
export function ThreadRow({ data }: { data: CardData }) {
  const { href, title, topic, body: note, date, keywords, coverUrl } = data;
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

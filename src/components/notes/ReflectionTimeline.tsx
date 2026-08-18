"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { dayLabel, groupByWeek, isUrl, Reflection } from "@/lib/reflections";
import { useBooks } from "@/lib/useBooks";
import { useMetrics } from "@/lib/useMetrics";

const styles = {
  wrap: "flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6 overflow-y-auto pb-2",
  week: "flex w-full min-w-0 flex-col gap-2",
  weekHead: "flex w-full min-w-0 items-center gap-3 text-left",
  weekCaret: "shrink-0 text-gray-300",
  weekCount: "shrink-0 text-[11px] text-gray-400 tabular-nums",
  weekLabel: "shrink-0 text-xs font-medium text-gray-500 tabular-nums",
  weekYear: "shrink-0 text-[11px] text-gray-300 tabular-nums",
  weekLine: "h-px flex-1 bg-gray-200",
  // 線往內縮一點、文字也靠近一點，圓點才不會孤零零掉在最左邊
  items: "ml-2 flex w-full min-w-0 flex-col border-l border-gray-200 pl-3",
  // 封面靠左、內容靠右；沒有封面的就只有右邊那欄
  item: "relative flex w-full min-w-0 items-start gap-3 py-2 text-left",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  // 圓點要壓在線上：pl-3（12px）＋ 邊框 0.5px ＋ 自己的半徑 3.5px
  dot: "absolute -left-[16px] top-3.5 size-[7px] rounded-full ring-2 ring-white",
  head: "flex w-full min-w-0 items-baseline gap-2",
  source: "mt-0.5 text-[11px] text-gray-400",
  cover: "h-11 w-[30px] shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10",
  kind: "shrink-0 rounded px-1.5 py-0.5 text-[11px]",
  title: "min-w-0 flex-1 truncate text-sm font-medium",
  date: "shrink-0 text-[11px] text-gray-400 tabular-nums",
  // 摺起來只給一行，展開才是完整內文加換行
  peek: "w-full min-w-0 truncate text-xs text-gray-500",
  note: "w-full min-w-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-700",
  tags: "flex w-full min-w-0 flex-wrap items-center gap-1 pt-1",
  tag: "rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500",
  origin2: "ml-auto flex shrink-0 items-center gap-1 text-[11px] text-gray-400 hover:text-gray-900",
  origin: "max-w-full truncate text-[11px] text-gray-400",
  originLink: "max-w-full truncate text-[11px] text-gray-400 underline hover:text-gray-900",
};

/** 列表那邊的標籤也用這個，兩種看法的顏色要對得起來 */
export const SOURCE_TONES: Record<Reflection["source"], string> = {
  書籍: "bg-amber-100 text-amber-800",
  文章: "bg-blue-100 text-blue-800",
  紀事: "bg-emerald-100 text-emerald-800",
};

const DOT_TONES: Record<Reflection["source"], string> = {
  書籍: "bg-amber-400",
  文章: "bg-blue-400",
  紀事: "bg-emerald-400",
};

/** 摺疊時的第一行；心得常常是多行的，取到第一個換行為止 */
function firstLine(note: string): string {
  return note.split(/\r?\n/).find((line) => line.trim()) ?? "";
}

/**
 * 以週為單位的垂直時間軸。
 *
 * 直的而不是橫的：文章與紀事是「點」，而且點上有字要讀——水平軸上同一週的
 * 幾則標題會疊在一起，展開的內文也沒地方長。水平留給有起訖的書（ReadingTimeline）。
 */
export function ReflectionTimeline({ reflections }: { reflections: Reflection[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  // 記「收起來的是哪幾週」而不是展開的：預設全開，收起來才是特例
  const [closedWeeks, setClosedWeeks] = useState<Set<string>>(new Set());
  // 數字只在展開時出現：摺著的數線是拿來讀的，不該有數字在旁邊閃
  const { latestByEntry } = useMetrics();
  // 延伸自某本書時秀出封面；文章沒有封面，只顯示書名
  const { books } = useBooks();
  const coverById = new Map(books.filter((b) => b.coverUrl).map((b) => [b.id, b.coverUrl]));

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleWeek(key: string) {
    setClosedWeeks((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  const weeks = groupByWeek(reflections);

  return (
    <div className={styles.wrap}>
      {weeks.map((week) => (
        <section key={week.key || "undated"} className={styles.week}>
          <button type="button" onClick={() => toggleWeek(week.key)} className={styles.weekHead}>
            {closedWeeks.has(week.key) ? (
              <ChevronRight size={14} strokeWidth={1.5} className={styles.weekCaret} />
            ) : (
              <ChevronDown size={14} strokeWidth={1.5} className={styles.weekCaret} />
            )}
            <span className={styles.weekLabel}>{week.label}</span>
            {week.year > 0 && <span className={styles.weekYear}>{week.year}</span>}
            <span className={styles.weekLine} />
            <span className={styles.weekCount}>{week.items.length}</span>
          </button>

          <div className={closedWeeks.has(week.key) ? "hidden" : styles.items}>
            {week.items.map((r) => {
              const id = `${r.source}-${r.id}`;
              const open = openIds.has(id);
              const cover = r.sourceId ? coverById.get(r.sourceId) : undefined;
              return (
                <div key={id}>
                  {/* 整列可點＝展開；要去原本的地方是右下角那個連結，兩件事分開 */}
                  <button type="button" onClick={() => toggle(id)} className={styles.item}>
                    <span className={`${styles.dot} ${DOT_TONES[r.source]}`} />

                    {/* 讀書心得左邊放封面，一眼看得出是哪一本 */}
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className={styles.cover} />
                    )}

                    <span className={styles.body}>
                      <span className={styles.head}>
                        <span className={`${styles.kind} ${SOURCE_TONES[r.source]}`}>
                          {r.kind || r.source}
                        </span>
                        <span className={styles.title}>{r.title}</span>
                        <span className={styles.date}>{dayLabel(r.date)}</span>
                      </span>

                      {open ? (
                        <span className={styles.note}>{r.note}</span>
                      ) : (
                        <span className={styles.peek}>{firstLine(r.note)}</span>
                      )}

                      {/* 標題已經是書名時就不重複講一次；封面本身也說明了是哪一本 */}
                      {r.sourceTitle && r.sourceTitle !== r.title && !cover && (
                        <span className={styles.source}>延伸自 {r.sourceTitle}</span>
                      )}

                      {open && (
                        <span className={styles.tags}>
                          {(() => {
                            const metric = latestByEntry.get(r.id);
                            if (!metric) return null;
                            return (
                              <span className={styles.origin}>
                                {metric.views} 次瀏覽
                                {metric.reads && `・${metric.reads} 次閱讀`}（{metric.date}）
                              </span>
                            );
                          })()}
                          {r.origin?.trim() &&
                            (isUrl(r.origin) ? (
                              <a
                                href={r.origin}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={styles.originLink}
                              >
                                來源
                              </a>
                            ) : (
                              <span className={styles.origin}>來源：{r.origin}</span>
                            ))}
                          {r.keywords.map((name) => (
                            <span key={name} className={styles.tag}>
                              {name}
                            </span>
                          ))}
                          <Link
                            href={r.href}
                            onClick={(e) => e.stopPropagation()}
                            className={styles.origin2}
                          >
                            {r.source}
                            <ExternalLink size={12} strokeWidth={1.5} />
                          </Link>
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Favicon } from "@/components/ui/Favicon";
import { dayLabel, groupByWeek, isUrl, Reflection } from "@/lib/reflections";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useMetrics } from "@/lib/useMetrics";

const styles = {
  wrap: "flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6 overflow-y-auto pb-2",
  week: "flex w-full min-w-0 flex-col gap-2",
  weekHead: "flex w-full min-w-0 items-center gap-3 text-left",
  weekCaret: "shrink-0 text-gray-300",
  // 跟週的箭頭同一個角色，只是小一階：收起來是 ›，展開是 ⌄
  caret: "shrink-0 self-center text-gray-300",
  weekCount: "shrink-0 text-[11px] text-gray-400 tabular-nums",
  weekLabel: "shrink-0 text-xs font-medium text-gray-500 tabular-nums",
  weekYear: "shrink-0 text-[11px] text-gray-300 tabular-nums",
  weekLine: "h-px flex-1 bg-gray-200",
  // 線往內縮一點、文字也靠近一點，圓點才不會孤零零掉在最左邊。
  // 這裡不能加 w-full：w-full 是 100% 寬，再加上 ml-2 就整整超出父層 8px，
  // 右邊的日期與「紀事」連結會被切掉。flex 子項本來就會撐滿，不用自己宣告。
  items: "ml-2 flex min-w-0 flex-col border-l border-gray-200 pl-3",
  // 封面靠左、內容靠右；沒有封面的就只有右邊那欄
  item: "relative flex w-full min-w-0 items-start gap-3 py-2 text-left",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  // 圓點要壓在線上：pl-3（12px）＋ 邊框 0.5px ＋ 自己的半徑 3.5px
  dot: "absolute -left-[16px] top-3.5 size-[7px] rounded-full ring-2 ring-white",
  head: "flex w-full min-w-0 items-baseline gap-2 text-left",
  // 內文整塊是連結：點字就進編輯頁，hover 才變色，平常不要看起來像連結
  noteLink: "block w-full min-w-0 rounded hover:bg-gray-50",
  // 收起來時整列只有一行，封面跟著縮成一行高，展開才長回來
  cover: "shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10 transition-all",
  coverOpen: "h-11 w-[30px]",
  coverClosed: "h-5 w-[14px]",
  kind: "shrink-0 rounded px-1.5 py-0.5 text-[11px]",
  title: "min-w-0 flex-1 truncate text-sm font-medium",
  date: "shrink-0 text-[11px] text-gray-400 tabular-nums",
  note: "w-full min-w-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-700",
  tags: "flex w-full min-w-0 flex-wrap items-center gap-1 pt-1",
  tag: "rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500",
  origin2:
    "ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-gray-400 hover:text-gray-900",
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
  // 延伸自某本書時秀出封面；延伸自文章就用站台圖示，兩種都在最左邊認得出來源
  const { books } = useBooks();
  const { articles } = useArticles();
  const coverById = new Map(books.filter((b) => b.coverUrl).map((b) => [b.id, b.coverUrl]));
  const articleUrlById = new Map(articles.map((a) => [a.id, a.sourceUrl]));

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
              // 沒封面才輪到 favicon：延伸自書就該看到書封
              const articleUrl =
                !cover && r.sourceId && articleUrlById.has(r.sourceId)
                  ? articleUrlById.get(r.sourceId)!
                  : undefined;
              return (
                <div key={id}>
                  {/* 標題那一行負責開合，內文本身是連結——想改字就直接點字，
                      不用先展開再去找一個小小的「紀事↗」 */}
                  <div className={styles.item}>
                    <span className={`${styles.dot} ${DOT_TONES[r.source]}`} />

                    {/* 讀書心得左邊放封面，一眼看得出是哪一本 */}
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className={`${styles.cover} ${open ? styles.coverOpen : styles.coverClosed}`}
                      />
                    )}

                    {articleUrl !== undefined && (
                      <Favicon
                        url={articleUrl}
                        fallback={r.sourceTitle || r.title}
                        className="mt-0.5 size-5"
                      />
                    )}

                    <div className={styles.body}>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-expanded={open}
                        className={styles.head}
                      >
                        {open ? (
                          <ChevronDown size={14} strokeWidth={1.5} className={styles.caret} />
                        ) : (
                          <ChevronRight size={14} strokeWidth={1.5} className={styles.caret} />
                        )}
                        <span className={`${styles.kind} ${SOURCE_TONES[r.source]}`}>
                          {r.kind || r.source}
                        </span>
                        <span className={styles.title}>{r.title}</span>
                        <span className={styles.date}>{dayLabel(r.date)}</span>
                      </button>

                      {/* 收起來就只剩標題那一行；內文要展開才出現，點它進編輯頁 */}
                      {open && r.note.trim() && (
                        <Link href={r.href} className={styles.noteLink}>
                          <span className={styles.note}>{r.note}</span>
                        </Link>
                      )}

                      {open && (
                        <div className={styles.tags}>
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
                          <Link href={r.href} className={styles.origin2}>
                            {r.source}
                            <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

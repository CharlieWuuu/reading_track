"use client";

import Link from "next/link";
import { KeywordTag } from "@/components/keywords/KeywordTag";
import { Favicon } from "@/components/ui/Favicon";
import { dayLabel, groupByWeek, isUrl, Reflection, timeLabel } from "@/lib/reflections";
import { tagColorClass } from "@/lib/tagColors";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useMetrics } from "@/lib/useMetrics";

const styles = {
  wrap: "flex min-h-0 w-full min-w-0 flex-1 flex-col gap-5 overflow-y-auto pb-2",
  week: "flex w-full min-w-0 flex-col",
  // 週只剩一條分隔，不再是可收合的按鈕：整條流是拿來一路往下讀的
  weekHead: "flex w-full min-w-0 items-center gap-3 pb-1",
  weekNumber: "shrink-0 text-xs font-medium text-gray-700 tabular-nums",
  weekLabel: "shrink-0 text-xs text-gray-400 tabular-nums",
  weekYear: "shrink-0 text-[11px] text-gray-300 tabular-nums",
  weekLine: "h-px flex-1 bg-gray-200",
  items: "flex min-w-0 flex-col divide-y divide-gray-100",
  item: "flex w-full min-w-0 items-start gap-3 py-3 text-left",
  // 三種左圖佔一樣寬，右邊那欄的起點才會對齊成一直線
  avatar: "flex size-7 shrink-0 items-center justify-center",
  cover: "size-7 rounded-full object-cover shadow-sm ring-1 ring-black/10",
  // 沒有封面也沒有站台圖示時，用類型的第一個字當頭像
  initial: "flex size-7 items-center justify-center rounded-full text-xs font-medium",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  head: "flex w-full min-w-0 items-baseline gap-2",
  title: "min-w-0 truncate text-sm font-medium",
  kind: "shrink-0 rounded px-1 py-px text-[10px]",
  time: "ml-auto shrink-0 text-[11px] text-gray-400 tabular-nums",
  // 整塊是連結，但不做任何 hover 效果：一路往下讀的時候，滑鼠掃過一列就亮一列很吵
  noteLink: "flex w-full min-w-0 flex-col gap-1",
  note: "w-full min-w-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-700",
  foot: "flex w-full min-w-0 flex-wrap items-center gap-1",
  tag: "rounded bg-gray-100 px-1 py-px text-[10px] text-gray-500 hover:bg-gray-200",
  origin: "max-w-full truncate text-[11px] text-gray-400",
  originLink: "max-w-full truncate text-[11px] text-gray-400 underline hover:text-gray-900",
};

/**
 * 類型的顏色由名字決定，不另外維護一張「類型→顏色」的表。
 *
 * 那張表得跟著新類型一起維護，而它換來的只是「這個顏色是我挑的」；
 * 由名字算出來的顏色一樣穩定——同一個類型永遠同一色，這才是顏色的作用。
 */
function kindTone(kind: string): string {
  return tagColorClass(kind, []);
}

/**
 * 一路往下讀的書寫流。
 *
 * 不折疊：內文才是主體，把它藏在箭頭後面等於每一則都要多按一次才知道值不值得讀。
 * 左邊那張小圖負責講來源——書封、站台圖示、或類型的第一個字，
 * 掃過去就知道這一則是從哪來的，不需要一條數線也不需要「延伸自 ○○」那行字。
 */
export function ReflectionTimeline({ reflections }: { reflections: Reflection[] }) {
  const { latestByEntry } = useMetrics();
  const { books } = useBooks();
  const { articles } = useArticles();
  const coverById = new Map(books.filter((b) => b.coverUrl).map((b) => [b.id, b.coverUrl]));
  const articleUrlById = new Map(articles.map((a) => [a.id, a.sourceUrl]));

  const weeks = groupByWeek(reflections);

  return (
    <div className={styles.wrap}>
      {weeks.map((week) => (
        <section key={week.key || "undated"} className={styles.week}>
          <div className={styles.weekHead}>
            {/* 第幾週擺最前面：回顧的時候先想到的是「這是第幾週」，日期是為了對上它 */}
            {week.week > 0 && <span className={styles.weekNumber}>第 {week.week} 週</span>}
            <span className={styles.weekLabel}>{week.label}</span>
            {week.year > 0 && <span className={styles.weekYear}>{week.year}</span>}
            <span className={styles.weekLine} />
          </div>

          <div className={styles.items}>
            {week.items.map((r) => {
              const id = `${r.source}-${r.id}`;
              const cover = r.sourceId ? coverById.get(r.sourceId) : undefined;
              // 沒封面才輪到 favicon：延伸自書就該看到書封
              const articleUrl =
                !cover && r.sourceId && articleUrlById.has(r.sourceId)
                  ? articleUrlById.get(r.sourceId)!
                  : undefined;
              const kind = r.kind || r.source;
              const metric = latestByEntry.get(r.id);
              const time = timeLabel(r.date);
              // 三樣都沒有就別畫那一列，不然每一則底下都多一段空白
              const hasFoot = Boolean(metric || r.origin?.trim() || r.keywords.length);

              return (
                <div key={id} className={styles.item}>
                  <div className={styles.avatar}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className={styles.cover} />
                    ) : articleUrl !== undefined ? (
                      <Favicon
                        url={articleUrl}
                        fallback={r.sourceTitle || r.title}
                        className="size-7 rounded-full"
                      />
                    ) : (
                      <span className={`${styles.initial} ${kindTone(kind)}`}>{kind[0]}</span>
                    )}
                  </div>

                  <div className={styles.body}>
                    {/* 標題連同內文整塊是連結：點哪裡都是進編輯頁，
                        不需要右下角再放一顆「紀事↗」講同一件事 */}
                    <Link href={r.href} className={styles.noteLink}>
                      <span className={styles.head}>
                        <span className={styles.title}>{r.title}</span>
                        <span className={`${styles.kind} ${kindTone(kind)}`}>{kind}</span>
                        <span className={styles.time}>
                          {dayLabel(r.date)}
                          {time && ` ${time}`}
                        </span>
                      </span>
                      {r.note.trim() && <span className={styles.note}>{r.note}</span>}
                    </Link>

                    {hasFoot && (
                      <div className={styles.foot}>
                        {metric && (
                          <span className={styles.origin}>
                            {metric.views} 次瀏覽
                            {metric.reads && `・${metric.reads} 次閱讀`}（{metric.date}）
                          </span>
                        )}
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
                          <KeywordTag key={name} name={name} className={styles.tag} />
                        ))}
                      </div>
                    )}
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

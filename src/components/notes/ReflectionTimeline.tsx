"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { groupByWeek, Reflection } from "@/lib/reflections";
import { SOURCE_TONES } from "./ReflectionSection";

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pb-2",
  week: "flex flex-col gap-2",
  weekHead: "flex items-center gap-3",
  weekLabel: "shrink-0 text-xs font-medium text-gray-500 tabular-nums",
  weekYear: "shrink-0 text-[11px] text-gray-300 tabular-nums",
  weekLine: "h-px flex-1 bg-gray-200",
  // 直線畫在左邊，點掛在線上：ml 要跟點的半徑對齊，不然線會歪掉
  items: "flex flex-col border-l border-gray-200 pl-4 ml-[3px]",
  item: "relative flex flex-col gap-1 py-2 text-left",
  dot: "absolute -left-[21px] top-3.5 size-[7px] rounded-full ring-2 ring-white",
  head: "flex items-baseline gap-2",
  kind: "shrink-0 rounded px-1.5 py-0.5 text-[11px]",
  title: "min-w-0 flex-1 truncate text-sm font-medium",
  date: "shrink-0 text-[11px] text-gray-400 tabular-nums",
  // 摺起來只給一行，展開才是完整內文加換行
  peek: "truncate text-xs text-gray-500",
  note: "text-sm leading-relaxed whitespace-pre-wrap text-gray-700",
  tags: "flex flex-wrap items-center gap-1 pt-1",
  tag: "rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500",
  source: "ml-auto flex shrink-0 items-center gap-1 text-[11px] text-gray-400 hover:text-gray-900",
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

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  const weeks = groupByWeek(reflections);

  return (
    <div className={styles.wrap}>
      {weeks.map((week) => (
        <section key={week.key || "undated"} className={styles.week}>
          <div className={styles.weekHead}>
            <span className={styles.weekLabel}>{week.label}</span>
            {week.year > 0 && <span className={styles.weekYear}>{week.year}</span>}
            <span className={styles.weekLine} />
          </div>

          <div className={styles.items}>
            {week.items.map((r) => {
              const id = `${r.source}-${r.id}`;
              const open = openIds.has(id);
              return (
                <div key={id}>
                  {/* 整列可點＝展開；要去原本的地方是右下角那個連結，兩件事分開 */}
                  <button type="button" onClick={() => toggle(id)} className={styles.item}>
                    <span className={`${styles.dot} ${DOT_TONES[r.source]}`} />

                    <span className={styles.head}>
                      <span className={`${styles.kind} ${SOURCE_TONES[r.source]}`}>
                        {r.kind || r.source}
                      </span>
                      <span className={styles.title}>{r.title}</span>
                      <span className={styles.date}>{r.date ?? ""}</span>
                    </span>

                    {open ? (
                      <span className={styles.note}>{r.note}</span>
                    ) : (
                      <span className={styles.peek}>{firstLine(r.note)}</span>
                    )}

                    {open && (
                      <span className={styles.tags}>
                        {r.keywords.map((name) => (
                          <span key={name} className={styles.tag}>
                            {name}
                          </span>
                        ))}
                        <Link
                          href={r.href}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.source}
                        >
                          {r.source}
                          <ExternalLink size={12} strokeWidth={1.5} />
                        </Link>
                      </span>
                    )}
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

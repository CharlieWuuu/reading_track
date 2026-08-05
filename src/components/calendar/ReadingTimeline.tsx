"use client";

import Link from "next/link";
import { useState } from "react";
import { PagerButton } from "@/components/ui/PagerButton";
import { tagColorClass, tagOrder } from "@/lib/tagColors";
import { useCategories } from "@/lib/useCategories";
import { Book, splitTags } from "@/types/book";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const DAY_MS = 24 * 60 * 60 * 1000;

/** 只留年月日：帶著時分秒去比較，跨日的天數會多算一天 */
function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** 一本書在某一週裡佔到的格子 */
interface Segment {
  book: Book;
  /** 這一週的第幾格開始（0–6）、佔幾格 */
  start: number;
  span: number;
  /** 跨到上／下一週：那一端不封口，看得出來還沒結束 */
  opensLeft: boolean;
  opensRight: boolean;
}

/**
 * 閱讀期間：月曆的格線，加上橫跨多天的長條。
 *
 * 跟月曆看的是不同的事——月曆是「哪一天讀完」，這裡是「那幾天在讀什麼」。
 * 用同一組格線但把書畫成跨天的長條，像行事曆上的多日行程，
 * 一眼看得出一本書讀了多久、哪幾天同時在讀好幾本。
 */
export function ReadingTimeline({
  books,
  action,
}: {
  books: Book[];
  action?: React.ReactNode;
}) {
  const { categories } = useCategories();
  const order = tagOrder(categories);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // 這個月的格線：從當月一號所在那一週的週日開始，補滿整數週
  const first = new Date(year, month, 1);
  const gridStart = addDays(first, -first.getDay());
  const last = new Date(year, month + 1, 0);
  const weekCount = Math.ceil((daysBetween(gridStart, last) + 1) / 7);

  const weeks: Segment[][][] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(gridStart, w * 7);
    const weekEnd = addDays(weekStart, 6);

    const segments: Segment[] = [];
    for (const book of books) {
      const start = parseDate(book.startDate);
      if (!start) continue; // 沒有開始日期就畫不出期間

      // 還在讀的畫到今天為止
      const end = parseDate(book.endDate) ?? today;
      if (end < weekStart || start > weekEnd) continue;

      const from = start < weekStart ? weekStart : start;
      const to = end > weekEnd ? weekEnd : end;

      segments.push({
        book,
        start: daysBetween(weekStart, from),
        span: daysBetween(from, to) + 1,
        opensLeft: start < weekStart,
        opensRight: end > weekEnd,
      });
    }

    // 長的排上面；再把同一週裡不重疊的塞進同一列，列數才不會等於書本數
    segments.sort((a, b) => b.span - a.span || a.start - b.start);
    const lanes: Segment[][] = [];
    for (const segment of segments) {
      const lane = lanes.find((row) =>
        row.every(
          (s) => segment.start >= s.start + s.span || segment.start + segment.span <= s.start
        )
      );
      if (lane) lane.push(segment);
      else lanes.push([segment]);
    }
    weeks.push(lanes);
  }

  function goMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <PagerButton direction="prev" onClick={() => goMonth(-1)} label="上個月" />
          <span className="w-22 whitespace-nowrap text-center text-sm font-medium">
            {year} 年 {month + 1} 月
          </span>
          <PagerButton direction="next" onClick={() => goMonth(1)} label="下個月" />
        </div>
        {action}
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b text-center text-xs text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1.5">
            {w}
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col divide-y">
        {weeks.map((lanes, weekIndex) => {
          const weekStart = addDays(gridStart, weekIndex * 7);
          return (
            <div key={weekIndex} className="flex min-h-0 flex-1 flex-col">
              {/* 日期數字 */}
              <div className="grid shrink-0 grid-cols-7">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(weekStart, i);
                  const inMonth = date.getMonth() === month;
                  const isToday = date.toDateString() === today.toDateString();
                  return (
                    <div
                      key={i}
                      className={`border-l px-1 py-1 text-xs first:border-l-0 ${
                        inMonth ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      <span
                        className={
                          isToday
                            ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white"
                            : "inline-flex h-5 w-5 items-center justify-center"
                        }
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 期間長條：一列一組互不重疊的書，跨幾天就有多寬 */}
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-0.5 pb-1">
                {lanes.map((lane, laneIndex) => (
                  <div key={laneIndex} className="relative h-5 shrink-0">
                    {lane.map((segment) => (
                      <Link
                        key={segment.book.id}
                        href={`/books/${segment.book.id}/edit`}
                        title={`${segment.book.title}｜${segment.book.startDate} ～ ${
                          segment.book.endDate ?? "閱讀中"
                        }`}
                        style={{
                          left: `${(segment.start / 7) * 100}%`,
                          width: `${(segment.span / 7) * 100}%`,
                        }}
                        className={`absolute flex h-5 items-center overflow-hidden px-1.5 text-[11px] whitespace-nowrap hover:brightness-95 ${
                          segment.opensLeft ? "" : "rounded-l"
                        } ${segment.opensRight ? "" : "rounded-r"} ${tagColorClass(
                          splitTags(segment.book.domain)[0] ?? segment.book.title,
                          order
                        )}`}
                      >
                        {/* 跨週的後半段不重複寫書名，免得整頁都是同一個書名 */}
                        {!segment.opensLeft && (
                          <span className="truncate">{segment.book.title}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

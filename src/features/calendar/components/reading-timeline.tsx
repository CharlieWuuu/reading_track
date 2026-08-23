"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { bookEditHref } from "@/config/routes";
import { Book } from "@/types/book";
import {
  daysBetween,
  monthTicks,
  packLanes,
  spanDays,
  spanRange,
  startOfDay,
  toSpans,
} from "@/utils/timeline";

/** 一天多寬。一個月大約 300px，月份刻度才寫得下、線也看得出長短 */
const DAY_PX = 10;
/** 書名一個字大約這麼寬（text-[10px] 的漢字），用來估這一段實際佔多寬 */
const CHAR_PX = 10;
const LANE_PX = 26;

/**
 * 閱讀期間：一條連續的日期軸，每本書是一段橫線。
 *
 * 刻意不切月份——一本書讀三個月，切月份要翻三次才看得完，
 * 而「讀了多久」正是這張圖唯一在講的事。橫向捲，寬度隨期間長度。
 *
 * 顏色統一：線的位置與長度已經說完全部的資訊，
 * 再按分類上色只會讓人以為顏色另有含意。
 */
export function ReadingTimeline({ books }: { books: Book[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());
  const spans = toSpans(books, today);
  const range = spanRange(spans);

  // 開起來先看最近的。整條軸可能橫跨好幾年，從最早那一頭開始等於一片空白
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [books]);

  if (!range) {
    return (
      <div className="rounded-surface flex min-h-0 flex-1 items-center justify-center border bg-white p-8 text-sm text-gray-500">
        還沒有填了日期的書
      </div>
    );
  }

  // 一段實際佔多寬＝線與書名取長的那一個。只看線的話，讀一天的書
  // 線只有 10px、書名卻有好幾個字，兩個名字會疊在一起
  const lanes = packLanes(spans, (span) =>
    Math.max(spanDays(span), Math.ceil((span.book.title.length * CHAR_PX + 8) / DAY_PX)),
  );
  const totalDays = daysBetween(range.from, range.to) + 1;
  const width = totalDays * DAY_PX;
  const ticks = monthTicks(range.from, range.to);
  const todayOffset =
    today >= range.from && today <= range.to ? daysBetween(range.from, today) : -1;

  return (
    <div className="rounded-surface flex min-h-0 flex-1 flex-col overflow-hidden border bg-white">
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
        <div style={{ width }} className="relative">
          {/* 月份刻度貼在頂端，捲直向時跟著走 */}
          <div className="bg-surface sticky top-0 z-10 flex border-b text-xs text-gray-500">
            {ticks.map((tick) => (
              <div
                key={tick.offset}
                style={{ width: tick.days * DAY_PX }}
                className="border-rule-soft shrink-0 truncate border-l px-1 py-1.5 first:border-l-0"
              >
                {tick.year ? `${tick.year} 年 ${tick.label}` : tick.label}
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: lanes.length * LANE_PX + 12 }}>
            {/* 月份格線畫到底，才看得出一段線橫跨了哪幾個月 */}
            {ticks.slice(1).map((tick) => (
              <span
                key={tick.offset}
                style={{ left: tick.offset * DAY_PX }}
                className="bg-rule-soft absolute inset-y-0 w-px"
              />
            ))}
            {todayOffset >= 0 && (
              <span
                style={{ left: todayOffset * DAY_PX }}
                className="bg-accent absolute inset-y-0 w-px"
                title="今天"
              />
            )}

            {lanes.map((lane, laneIndex) =>
              lane.map((span) => {
                const offset = daysBetween(range.from, span.start);
                const days = daysBetween(span.start, span.end) + 1;
                return (
                  <Link
                    key={span.book.id}
                    href={bookEditHref(span.book.id)}
                    title={`${span.book.title}｜${span.book.startDate} ～ ${
                      span.book.endDate ?? "閱讀中"
                    }`}
                    style={{ left: offset * DAY_PX, top: laneIndex * LANE_PX + 6 }}
                    className="absolute flex h-5 flex-col justify-end"
                  >
                    {/* 書名不關在線的寬度裡：讀一天的書只有 6px，關進去等於看不到名字 */}
                    <span className="text-series-1 pointer-events-none absolute bottom-2.5 left-1 whitespace-nowrap">
                      <span className="text-[10px] leading-none">{span.book.title}</span>
                    </span>
                    <span
                      style={{ width: Math.max(days * DAY_PX, DAY_PX) }}
                      className="relative h-1.5"
                    >
                      <span className="bg-series-1 absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" />
                      <span className="bg-series-1 absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                      {/* 還在讀的線停在今天但不封口，看得出這段還沒結束 */}
                      {!span.ongoing && (
                        <span className="bg-series-1 absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                      )}
                    </span>
                  </Link>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { PagerButton } from "@/components/ui/PagerButton";
import { Book } from "@/types/book";

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
  /** 跨到上／下一週：那一端不畫點，看得出來這段還沒開始／還沒結束 */
  opensLeft: boolean;
  opensRight: boolean;
  /** 還在讀（沒有讀完日期）：線停在今天，但不封口 */
  ongoing: boolean;
}

/** 一週要畫的線，一列一組互不重疊的書 */
type Week = Segment[][];

/**
 * 閱讀期間：月曆的格線上，把每本書畫成一條橫跨數天的數線。
 *
 * 頭尾的點＝真正的開始與讀完那天；沒有點的那一端表示這段延伸到上／下一週。
 * 書名每一段都寫一次（包含跨週後的後半段），不然只看到一條線不知道是哪本書。
 *
 * 顏色統一：線的位置與長度已經說完了全部的資訊，
 * 再按分類上色只會讓人以為顏色另有含意。
 */
export function ReadingTimeline({ books, action }: { books: Book[]; action?: React.ReactNode }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // 這個月的格線：從當月一號所在那一週的週日開始，補滿整數週
  const first = new Date(year, month, 1);
  const gridStart = addDays(first, -first.getDay());
  const last = new Date(year, month + 1, 0);
  const weekCount = Math.ceil((daysBetween(gridStart, last) + 1) / 7);

  const weeks: Week[] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(gridStart, w * 7);
    const weekEnd = addDays(weekStart, 6);

    const segments: Segment[] = [];
    for (const book of books) {
      const finished = parseDate(book.endDate);
      // 還在讀的畫到今天為止；只有讀完日期的，就當成那一天讀完的一個點
      const start = parseDate(book.startDate) ?? finished;
      const end = finished ?? today;
      if (!start) continue; // 兩個日期都沒有就畫不出期間
      if (end < weekStart || start > weekEnd) continue;

      const from = start < weekStart ? weekStart : start;
      const to = end > weekEnd ? weekEnd : end;

      segments.push({
        book,
        start: daysBetween(weekStart, from),
        span: daysBetween(from, to) + 1,
        opensLeft: start < weekStart,
        opensRight: end > weekEnd,
        ongoing: !finished,
      });
    }

    // 長的排上面；再把同一週裡不重疊的塞進同一列，列數才不會等於書本數
    segments.sort((a, b) => b.span - a.span || a.start - b.start);
    const lanes: Segment[][] = [];
    for (const segment of segments) {
      const lane = lanes.find((row) =>
        row.every(
          (s) => segment.start >= s.start + s.span || segment.start + segment.span <= s.start,
        ),
      );
      if (lane) lane.push(segment);
      else lanes.push([segment]);
    }

    weeks.push(lanes);
  }

  /** 未來的月份沒有紀錄可看，翻過去只是一片空白 */
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

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
          <span className="w-22 text-center text-sm font-medium whitespace-nowrap">
            {year} 年 {month + 1} 月
          </span>
          <PagerButton
            direction="next"
            onClick={() => goMonth(1)}
            disabled={atCurrentMonth}
            label="下個月"
          />
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

      {/*
        每一週的高度隨內容長，整張月曆再一起捲動。
        壓成等高的話，同時讀好幾本的那幾週會直接溢出去蓋到下一週的日期。
      */}
      <div className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
        {weeks.map((lanes, weekIndex) => {
          const weekStart = addDays(gridStart, weekIndex * 7);
          return (
            // 沒什麼可畫的那幾週不必佔滿高度，讓出來給忙的那幾週
            <div key={weekIndex} className="flex min-h-14 shrink-0 flex-col">
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
                        inMonth ? "text-gray-700" : "border-gray-100 text-gray-300"
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

              {/* 期間的數線：一列一組互不重疊的書，跨幾天就有多長 */}
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 px-0.5 pb-1">
                {lanes.map((lane, laneIndex) => (
                  <div key={laneIndex} className="relative h-4 shrink-0">
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
                        // 書名跟線都關在自己這一段的寬度裡，所以絕不會壓到隔壁那本
                        className="absolute flex h-4 flex-col justify-end overflow-hidden"
                      >
                        {/*
                          字直接貼在自己的線上；只有起點那一段要往右讓開，
                          不然書名的第一個字會壓在開始的點上。
                        */}
                        <span
                          className={`translate-y-0.5 truncate text-[9px] leading-2.5 text-[#2B5A8E] ${
                            segment.opensLeft ? "" : "pl-2"
                          }`}
                        >
                          {segment.book.title}
                        </span>
                        <span className="relative h-1.5 shrink-0">
                          <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#2B5A8E]" />
                          {/* 頭尾的點：只在真正的開始／讀完那天才畫；還在讀的線停在今天但不封口 */}
                          {!segment.opensLeft && (
                            <span className="absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#2B5A8E]" />
                          )}
                          {!segment.opensRight && !segment.ongoing && (
                            <span className="absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#2B5A8E]" />
                          )}
                        </span>
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

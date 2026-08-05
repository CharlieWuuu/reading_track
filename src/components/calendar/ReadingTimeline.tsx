"use client";

import Link from "next/link";
import { useState } from "react";
import { PagerButton } from "@/components/ui/PagerButton";
import { tagColorClass, tagOrder } from "@/lib/tagColors";
import { useCategories } from "@/lib/useCategories";
import { Book, splitTags } from "@/types/book";

/** 一次顯示幾個月。六個月大約是「最近在讀什麼」看得清楚、又看得出跨度的長度 */
const MONTHS_IN_VIEW = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

interface Bar {
  book: Book;
  /** 0–100，相對於目前視窗的左緣與寬度 */
  left: number;
  width: number;
  /** 還在讀：右端不封口，畫成往右淡出 */
  ongoing: boolean;
}

/**
 * 閱讀期間時間軸。
 *
 * 月曆只看得到「哪一天讀完」，看不出一本書讀了多久、也看不出同時在讀幾本。
 * 這裡把開始日期真正用起來——順帶讓沒填開始日期的書顯得突兀，
 * 那一區就是提醒自己去補的清單。
 */
export function ReadingTimeline({ books }: { books: Book[] }) {
  const { categories } = useCategories();
  const order = tagOrder(categories);

  const today = new Date();
  // offset 以月為單位，0 代表視窗結束於本月
  const [offset, setOffset] = useState(0);

  const windowEnd = addMonths(monthStart(today), offset + 1);
  const windowStart = addMonths(windowEnd, -MONTHS_IN_VIEW);
  const span = windowEnd.getTime() - windowStart.getTime();

  const months = Array.from({ length: MONTHS_IN_VIEW }, (_, i) => addMonths(windowStart, i));

  const { bars, missingStart } = buildBars();

  function buildBars() {
    const bars: Bar[] = [];
    const missingStart: Book[] = [];

    for (const book of books) {
      const start = parseDate(book.startDate);
      const end = parseDate(book.endDate);

      // 有讀完卻沒有開始日期的書，畫不出期間——列在下面提醒補資料
      if (!start) {
        if (end) missingStart.push(book);
        continue;
      }

      const ongoing = !end;
      const from = start.getTime();
      // 還在讀的畫到今天為止；今天之前就讀完的畫到完成日
      const to = (end ?? today).getTime() + DAY_MS;

      // 完全落在視窗外就不畫
      if (to <= windowStart.getTime() || from >= windowEnd.getTime()) continue;

      const clampedFrom = Math.max(from, windowStart.getTime());
      const clampedTo = Math.min(to, windowEnd.getTime());

      bars.push({
        book,
        left: ((clampedFrom - windowStart.getTime()) / span) * 100,
        // 一天的書也要看得到，給一個最小寬度
        width: Math.max(((clampedTo - clampedFrom) / span) * 100, 0.8),
        ongoing,
      });
    }

    // 開始得早的排上面，同一天則長的在上面
    bars.sort(
      (a, b) =>
        (parseDate(a.book.startDate)?.getTime() ?? 0) -
          (parseDate(b.book.startDate)?.getTime() ?? 0) || b.width - a.width
    );

    return { bars, missingStart };
  }

  const label = `${windowStart.getFullYear()} 年 ${windowStart.getMonth() + 1} 月 – ${
    addMonths(windowEnd, -1).getFullYear()
  } 年 ${addMonths(windowEnd, -1).getMonth() + 1} 月`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-center gap-3">
        <PagerButton direction="prev" onClick={() => setOffset((o) => o - 1)} label="往前一個月" />
        <span className="whitespace-nowrap text-sm font-medium">{label}</span>
        <PagerButton
          direction="next"
          onClick={() => setOffset((o) => o + 1)}
          disabled={offset >= 0}
          label="往後一個月"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white">
        {/* 月份刻度 */}
        <div className="flex shrink-0 border-b bg-gray-50 text-[11px] text-gray-500">
          {months.map((month) => (
            <div
              key={month.toISOString()}
              className="flex-1 border-l px-2 py-1 first:border-l-0"
            >
              {month.getMonth() + 1} 月
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {bars.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              這段期間沒有紀錄。填了「開始日期」的書才畫得出閱讀期間。
            </p>
          ) : (
            <ul className="divide-y">
              {bars.map(({ book, left, width, ongoing }) => (
                <li key={book.id} className="relative">
                  <Link href={`/books/${book.id}/edit`} className="block px-2 py-1.5 hover:bg-gray-50">
                    {/* 底層是月份格線，橫條疊在上面 */}
                    <div className="relative h-6">
                      <div className="absolute inset-0 flex">
                        {months.map((month) => (
                          <div key={month.toISOString()} className="flex-1 border-l first:border-l-0" />
                        ))}
                      </div>

                      <div
                        className={`absolute top-1 flex h-4 items-center overflow-hidden rounded px-1.5 text-[11px] whitespace-nowrap ${
                          ongoing ? "rounded-r-none" : ""
                        } ${tagColorClass(splitTags(book.domain)[0] ?? book.title, order)}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          // 還在讀的右端淡出，表示「還沒結束」
                          maskImage: ongoing
                            ? "linear-gradient(to right, black 70%, transparent)"
                            : undefined,
                        }}
                        title={`${book.title}｜${book.startDate ?? "?"} ～ ${book.endDate ?? "閱讀中"}`}
                      >
                        {book.title}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {missingStart.length > 0 && (
            <div className="flex flex-col gap-1 border-t bg-amber-50/50 p-3">
              <p className="text-xs font-medium text-amber-900">
                {missingStart.length} 本讀完的書沒有開始日期，畫不出閱讀期間
              </p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-amber-800">
                {missingStart.slice(0, 8).map((book) => (
                  <li key={book.id}>
                    <Link href={`/books/${book.id}/edit`} className="hover:underline">
                      {book.title}
                    </Link>
                  </li>
                ))}
                {missingStart.length > 8 && <li>還有 {missingStart.length - 8} 本…</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

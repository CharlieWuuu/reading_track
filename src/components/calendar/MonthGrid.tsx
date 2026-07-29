"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildMonthGrid } from "@/lib/calendarUtils";
import { Book } from "@/types/book";
import { InstapaperBookmark } from "@/lib/instapaper/client";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 格子裡只列第一篇文章，其餘用右邊的「+N」表示，完整清單看下方明細 */
function DayArticles({ articles }: { articles: InstapaperBookmark[] }) {
  if (articles.length === 0) return null;

  const first = articles[0];
  const hidden = articles.length - 1;

  return (
    <div className="mt-1 flex items-center gap-1">
      <a
        href={instapaperReadUrl(first.bookmark_id, first.url)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={first.title || first.url}
        className="min-w-0 flex-1 truncate rounded-sm bg-blue-50 px-1 py-0.5 text-[10px] text-blue-900 hover:bg-blue-100"
      >
        {first.title || first.url}
      </a>
      {hidden > 0 && (
        <span className="shrink-0 text-[10px] font-medium text-gray-500">
          +{hidden}
        </span>
      )}
    </div>
  );
}

export function MonthGrid({
  books,
  articles,
}: {
  books: Book[];
  articles: InstapaperBookmark[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showBooks, setShowBooks] = useState(true);
  const [showArticles, setShowArticles] = useState(true);
  // 手機版點選的日期（存 timestamp 才好比對），明細列在格子下方
  const [selectedTime, setSelectedTime] = useState(() => today.getTime());
  const selected = new Date(selectedTime);

  const days = useMemo(
    () =>
      buildMonthGrid(
        year,
        month,
        showBooks ? books : [],
        showArticles ? articles : [],
      ),
    [year, month, books, articles, showBooks, showArticles],
  );

  const selectedDay = days.find(
    (d) => d.date.toDateString() === selected.toDateString(),
  );

  /** 換月時把選取日移到該月 1 號，手機版下方明細才不會停在別的月份 */
  function goToMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedTime(new Date(nextYear, nextMonth, 1).getTime());
  }

  function goPrev() {
    goToMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  }

  function goNext() {
    goToMonth(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedTime(today.getTime());
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label="上個月"
            className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            ‹
          </button>
          <span className="w-28 whitespace-nowrap text-center text-sm font-medium">
            {year} 年 {month + 1} 月
          </span>
          <button
            onClick={goNext}
            aria-label="下個月"
            className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBooks((v) => !v)}
            className={`rounded border px-2 py-1 text-xs font-medium ${
              showBooks
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-400 hover:bg-gray-100"
            }`}
          >
            書籍
          </button>
          <button
            onClick={() => setShowArticles((v) => !v)}
            className={`rounded border px-2 py-1 text-xs font-medium ${
              showArticles
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-400 hover:bg-gray-100"
            }`}
          >
            文章
          </button>
          <button
            onClick={goToday}
            className="rounded border px-2 py-1 text-xs font-medium hover:bg-gray-100"
          >
            今天
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b text-center text-xs text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* 手機版：格子放小書封＋文章圓點，選到的那天在下面列出明細，整頁不用捲 */}
      <div className="grid shrink-0 grid-cols-7 sm:hidden">
        {days.map((day, i) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const isSelected =
            day.date.toDateString() === selected.toDateString();
          const isLastCol = i % 7 === 6;
          const isLastRow = i >= days.length - 7;
          return (
            <button
              key={i}
              onClick={() => setSelectedTime(day.date.getTime())}
              className={`flex h-16 flex-col items-center gap-0.5 py-1 ${
                isLastCol ? "" : "border-r"
              } ${isLastRow ? "" : "border-b"} ${
                isSelected
                  ? "bg-gray-100"
                  : day.inCurrentMonth
                    ? "bg-white"
                    : "bg-gray-50"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  isSelected
                    ? "bg-gray-900 text-white"
                    : isToday
                      ? "text-gray-900 ring-1 ring-gray-900"
                      : day.inCurrentMonth
                        ? "text-gray-700"
                        : "text-gray-300"
                }`}
              >
                {day.date.getDate()}
              </span>

              {/* 格子太窄，只放第一本的小書封，其餘用 +N 表示，點下去看下方明細 */}
              <span className="relative flex h-8 w-[1.35rem] shrink-0 items-center justify-center">
                {day.books.length > 0 &&
                  (day.books[0].coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={day.books[0].coverUrl}
                      alt=""
                      className="h-full w-full rounded-[2px] object-cover shadow-sm"
                    />
                  ) : (
                    <span className="h-full w-full rounded-[2px] bg-gray-300" />
                  ))}
                {day.books.length > 1 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-gray-900 px-1 text-[8px] leading-[1.2] text-white">
                    +{day.books.length - 1}
                  </span>
                )}
              </span>

              <span className="flex h-1.5 shrink-0 items-center">
                {day.articles.length > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t p-3 sm:hidden">
        <p className="mb-2 text-xs font-medium text-gray-500">
          {selected.getMonth() + 1} 月 {selected.getDate()} 日
        </p>
        {selectedDay &&
        (selectedDay.books.length > 0 || selectedDay.articles.length > 0) ? (
          <div className="space-y-2">
            {selectedDay.books.map((b) => (
              <Link
                key={b.id}
                href={`/books/${b.id}/edit`}
                className="flex items-center gap-2 rounded border px-2 py-1.5"
              >
                {b.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.coverUrl}
                    alt=""
                    className="h-9 w-6 rounded-sm object-cover"
                  />
                ) : (
                  <div className="h-9 w-6 rounded-sm bg-gray-200" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs">
                  {b.title}
                </span>
              </Link>
            ))}
            {selectedDay.articles.map((a) => (
              <a
                key={a.bookmark_id}
                href={instapaperReadUrl(a.bookmark_id, a.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate rounded bg-blue-50 px-2 py-1.5 text-xs text-blue-900"
              >
                {a.title || a.url}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">這天沒有紀錄</p>
        )}
      </div>

      {/* 格子內不捲動；平常靠「+N 篇」收合就放得下，展開時才由整個月曆區塊捲 */}
      <div className="hidden min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-y-auto sm:grid">
        {days.map((day, i) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const isLastCol = i % 7 === 6;
          const isLastRow = i >= days.length - 7;
          const bgClass = day.inCurrentMonth ? "bg-white" : "bg-gray-50";
          return (
            <div
              key={i}
              className={`min-h-28 p-1.5 ${isLastCol ? "" : "border-r"} ${
                isLastRow ? "" : "border-b"
              } ${bgClass}`}
            >
              {/* 日期與書封並排，省下日期獨占的那一行高度 */}
              <div className="flex items-start gap-1">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-gray-900 text-white"
                      : day.inCurrentMonth
                        ? "text-gray-700"
                        : "text-gray-300"
                  }`}
                >
                  {day.date.getDate()}
                </span>

                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {day.books.map((b) => (
                    <Link
                      key={b.id}
                      href={`/books/${b.id}/edit`}
                      title={b.title}
                      className="block"
                    >
                      {b.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="h-16 w-11 rounded-sm object-cover shadow-sm lg:h-20 lg:w-14"
                        />
                      ) : (
                        <div className="flex h-16 w-11 items-center justify-center rounded-sm bg-gray-200 text-[10px] leading-tight text-gray-500 lg:h-20 lg:w-14">
                          {b.title.slice(0, 2)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              <DayArticles articles={day.articles} bgClass={bgClass} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

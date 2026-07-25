"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildMonthGrid } from "@/lib/calendarUtils";
import { Book } from "@/types/book";
import { InstapaperBookmark } from "@/lib/instapaper/client";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

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

  const days = useMemo(
    () =>
      buildMonthGrid(
        year,
        month,
        showBooks ? books : [],
        showArticles ? articles : []
      ),
    [year, month, books, articles, showBooks, showArticles]
  );

  function goPrev() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label="上個月"
            className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            ‹
          </button>
          <span className="w-28 text-center text-sm font-medium">
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

      <div className="grid grid-cols-7 border-b text-center text-xs text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isToday =
            day.date.toDateString() === today.toDateString();
          const isLastCol = i % 7 === 6;
          const isLastRow = i >= days.length - 7;
          return (
            <div
              key={i}
              className={`min-h-24 p-1.5 ${isLastCol ? "" : "border-r"} ${
                isLastRow ? "" : "border-b"
              } ${day.inCurrentMonth ? "bg-white" : "bg-gray-50"}`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-gray-900 text-white"
                    : day.inCurrentMonth
                      ? "text-gray-700"
                      : "text-gray-300"
                }`}
              >
                {day.date.getDate()}
              </span>

              <div className="mt-1 flex flex-wrap gap-1">
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
                        className="h-10 w-7 rounded-sm object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-7 items-center justify-center rounded-sm bg-gray-200 text-[8px] text-gray-500">
                        {b.title.slice(0, 2)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-1 space-y-0.5">
                {day.articles.map((a) => (
                  <a
                    key={a.bookmark_id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={a.title || a.url}
                    className="block truncate rounded-sm bg-blue-50 px-1 py-0.5 text-[10px] text-blue-900 hover:bg-blue-100"
                  >
                    {a.title || a.url}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

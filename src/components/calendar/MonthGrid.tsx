"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildMonthGrid } from "@/lib/calendarUtils";
import { Book } from "@/types/book";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function MonthGrid({ books }: { books: Book[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = useMemo(() => buildMonthGrid(year, month, books), [year, month, books]);

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
    <div className="rounded-lg border bg-white">
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
        <button
          onClick={goToday}
          className="rounded border px-2 py-1 text-xs font-medium hover:bg-gray-100"
        >
          今天
        </button>
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
          return (
            <div
              key={i}
              className={`min-h-24 border-b border-r p-1.5 ${
                day.inCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PagerButton } from "@/components/ui/pager-button";
import {
  buildMonthGrid,
  CalendarDay,
  CalendarEntry,
  DatedEntry,
} from "@/features/calendar/utils/calendar-utils";
import { cellBorder } from "@/features/calendar/utils/cell-border";
import { imageSrc } from "@/utils/image-key";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * 格子裡怎麼畫，看的是這一筆有沒有封面，不是它屬於哪一種類型——
 * 有封面就畫封面（書、影集），沒有就畫一條標題（文章、札記、單字）。
 *
 * 原本按 books／articles／writings 各寫一套，連顏色都寫死；開一種新類型
 * 沒地方擺，只能再加一個分支。
 */
const withCover = (entries: readonly CalendarEntry[]) => entries.filter((e) => e.coverUrl);
const withoutCover = (entries: readonly CalendarEntry[]) => entries.filter((e) => !e.coverUrl);

/** 格子裡只列第一條，其餘用右邊的「+N」表示，完整清單看下方明細 */
function DayTitles({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) return null;

  const [first] = entries;
  const hidden = entries.length - 1;

  return (
    <div className="mt-1 flex items-center gap-1">
      <Link
        href={first.href}
        onClick={(e) => e.stopPropagation()}
        title={first.title}
        className="rounded-thumb text-ink-muted min-w-0 flex-1 truncate bg-gray-100 px-1 py-0.5 text-[10px] hover:bg-gray-200"
      >
        {first.title}
      </Link>
      {hidden > 0 && (
        <span className="shrink-0 text-[10px] font-medium text-gray-500">+{hidden}</span>
      )}
    </div>
  );
}

/** 某一天的完整清單，手機下方明細與桌機彈窗共用 */
function DayDetail({ day }: { day?: CalendarDay }) {
  if (!day || day.entries.length === 0) {
    return <p className="text-xs text-gray-400">這天沒有紀錄</p>;
  }

  return (
    <div className="space-y-2">
      {day.entries.map((entry) => (
        <Link
          key={entry.id}
          href={entry.href}
          title={entry.title}
          className="rounded-control flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50"
        >
          {entry.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc(entry.coverUrl)}
              alt=""
              className="rounded-thumb h-9 w-6 shrink-0 object-cover"
            />
          ) : (
            <span className="rounded-thumb h-9 w-6 shrink-0 bg-gray-200" />
          )}
          <span className="min-w-0 flex-1 truncate text-xs">{entry.title}</span>
        </Link>
      ))}
    </div>
  );
}

export function MonthGrid({ entries = [] }: { entries?: readonly DatedEntry[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  // 手機版點選的日期（存 timestamp 才好比對），明細列在格子下方
  const [selectedTime, setSelectedTime] = useState(() => today.getTime());
  const selected = new Date(selectedTime);
  // 桌機版點格子開的彈窗，null 表示沒開；不佔月曆高度所以不會產生捲動
  const [popupTime, setPopupTime] = useState<number | null>(null);

  const days = useMemo(() => buildMonthGrid(year, month, entries), [year, month, entries]);

  const selectedDay = days.find((d) => d.date.toDateString() === selected.toDateString());

  useEffect(() => {
    if (popupTime === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopupTime(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupTime]);

  const popupDate = popupTime === null ? null : new Date(popupTime);
  const popupDay =
    popupDate && days.find((d) => d.date.toDateString() === popupDate.toDateString());

  /** 換月時把選取日移到該月 1 號，手機版下方明細才不會停在別的月份 */
  function goToMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedTime(new Date(nextYear, nextMonth, 1).getTime());
    setPopupTime(null);
  }

  function goPrev() {
    goToMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  }

  /** 未來的月份沒有紀錄可看，翻過去只是一片空白 */
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  function goNext() {
    goToMonth(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  }

  return (
    <div className="rounded-surface flex min-h-0 flex-1 flex-col overflow-hidden border bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <PagerButton direction="prev" onClick={goPrev} label="上個月" />
          <span className="w-22 text-center text-sm font-medium whitespace-nowrap">
            {year} 年 {month + 1} 月
          </span>
          <PagerButton direction="next" onClick={goNext} disabled={atCurrentMonth} label="下個月" />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b text-center text-xs text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* 手機版：格子放小書封與數量，選到的那天在下面列出明細，整頁不用捲 */}
      <div className="grid shrink-0 grid-cols-7 sm:hidden">
        {days.map((day, i) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const isSelected = day.date.toDateString() === selected.toDateString();
          const covered = withCover(day.entries);
          const plain = withoutCover(day.entries);
          return (
            <button
              key={i}
              onClick={() => setSelectedTime(day.date.getTime())}
              // overflow-hidden + flex-1：格子高度固定，內容多的時候在自己裡面被裁掉，
              // 不會像原本那樣把圓點推到下一列的日期上
              className={`flex h-16 flex-col items-center gap-0.5 overflow-hidden py-1 ${cellBorder(i, days.length)} ${
                isSelected ? "bg-gray-100" : day.inCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  isSelected
                    ? "bg-control-bg text-control-ink"
                    : isToday
                      ? "text-accent ring-accent ring-1"
                      : day.inCurrentMonth
                        ? "text-gray-700"
                        : "text-gray-300"
                }`}
              >
                {day.date.getDate()}
              </span>

              {/*
                有封面的放第一張，其餘用 +N；沒封面的用數字說「這天有幾則」。
                原本是一顆圓點，但圓點只說得出「有」，說不出幾則。
              */}
              <span
                className={`flex min-h-0 flex-1 items-center justify-center gap-0.5 ${
                  day.inCurrentMonth ? "" : "opacity-50"
                }`}
              >
                {covered.length > 0 && (
                  <span className="relative flex h-full max-h-8 w-[1.35rem] shrink-0 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc(covered[0].coverUrl)}
                      alt=""
                      className="rounded-thumb h-full w-full object-cover shadow-sm"
                    />
                    {covered.length > 1 && (
                      <span className="absolute -top-1 -right-1 rounded-full bg-gray-900 px-1 text-[8px] leading-[1.2] text-white">
                        +{covered.length - 1}
                      </span>
                    )}
                  </span>
                )}
                {plain.length > 0 && (
                  <span className="text-ink-muted inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 px-1 text-[10px] leading-none font-medium tabular-nums">
                    {plain.length}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 格子內不捲動，內容固定；完整清單點格子開彈窗看 */}
      <div className="hidden min-h-0 flex-1 auto-rows-fr grid-cols-7 sm:grid">
        {days.map((day, i) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const border = cellBorder(i, days.length);
          const covered = withCover(day.entries);
          const plain = withoutCover(day.entries);
          return (
            // 點整格開這天的彈窗；格內的封面與標題連結照常可點
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setPopupTime(day.date.getTime())}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPopupTime(day.date.getTime());
                }
              }}
              // 當月與非當月的差別只在底色；整格降透明度會連書封一起變灰，反而髒
              className={`relative flex min-h-0 cursor-pointer flex-col overflow-hidden p-1.5 text-left ${border} ${
                day.inCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {/* 日期壓在左上角，封面才能對整個格子置中，不會被日期推偏 */}
              <span
                className={`absolute top-1.5 left-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-control-bg text-control-ink"
                    : day.inCurrentMonth
                      ? "text-gray-700"
                      : "text-gray-300"
                }`}
              >
                {day.date.getDate()}
              </span>

              {/* 一格只放第一張封面，其餘用 +N 表示，完整清單在彈窗裡 */}
              <div
                className={`flex min-h-0 flex-1 items-center justify-center ${
                  day.inCurrentMonth ? "" : "opacity-50"
                }`}
              >
                {covered.length > 0 && (
                  <span className="relative flex shrink-0">
                    <Link
                      href={covered[0].href}
                      title={covered[0].title}
                      onClick={(e) => e.stopPropagation()}
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc(covered[0].coverUrl)}
                        alt={covered[0].title}
                        className="rounded-thumb h-12 w-8 object-cover shadow-sm lg:h-14 lg:w-10"
                      />
                    </Link>
                    {covered.length > 1 && (
                      <span className="absolute -top-1 -right-1 rounded-full bg-gray-900 px-1 text-[9px] leading-[1.3] text-white">
                        +{covered.length - 1}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* 非當月只淡化內容，格子底色與日期維持原樣 */}
              <div className={day.inCurrentMonth ? "" : "opacity-50"}>
                <DayTitles entries={plain} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 手機版選取日的明細，佔滿月曆下方剩餘空間 */}
      <div className="min-h-0 flex-1 overflow-y-auto border-t p-3 sm:hidden">
        <p className="mb-2 text-xs font-medium text-gray-500">
          {selected.getMonth() + 1} 月 {selected.getDate()} 日
        </p>
        <DayDetail day={selectedDay} />
      </div>

      {/* 桌機版彈窗，浮在月曆上方所以不佔高度、不會讓頁面長出捲軸 */}
      {popupDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${popupDate.getMonth() + 1} 月 ${popupDate.getDate()} 日的紀錄`}
          onClick={() => setPopupTime(null)}
          className="fixed inset-0 z-50 hidden items-center justify-center bg-black/30 p-4 sm:flex"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-surface max-h-[70vh] w-full max-w-md overflow-y-auto bg-white p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">
                {popupDate.getFullYear()} 年 {popupDate.getMonth() + 1} 月 {popupDate.getDate()} 日
              </p>
              <button
                onClick={() => setPopupTime(null)}
                aria-label="關閉"
                className="rounded-control px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <DayDetail day={popupDay ?? undefined} />
          </div>
        </div>
      )}
    </div>
  );
}

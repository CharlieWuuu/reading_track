import { splitLines } from "@/types/book";
import { Entry } from "@/types/entry";

export type ReflectionSource = "書籍" | "文章" | "紀事";

/**
 * 數線上的一則。目前只有紀事會進來，型別留著來源欄位是為了之後
 * 想把書或文章也畫進同一條線時不用改形狀。
 */
export type Reflection = {
  id: string;
  source: ReflectionSource;
  title: string;
  date: string | null;
  note: string;
  keywords: string[];
  /** 點下去回到它原本的地方 */
  href: string;
  /** 紀事的類型，其他來源沒有 */
  kind?: string;
  /** 紀事的「來源」欄：網址或純文字（「紙本日記 8/17」），沒有就是空的 */
  origin?: string;
};

/** 純文字的來源不能拿去當連結，這裡只認 http(s) */
export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** requireNote 為真時只收有寫心得的；紀事頁要看到全部，所以傳 false */
export function entriesToReflections(entries: Entry[], requireNote = true): Reflection[] {
  return entries
    .filter((e) => !requireNote || e.note.trim())
    .map((e) => ({
      id: e.id,
      source: "紀事" as const,
      title: e.title,
      date: e.date,
      note: e.note,
      keywords: splitLines(e.keywords),
      href: `/entries/${e.id}/edit`,
      kind: e.kind,
      origin: e.link,
    }));
}

export type ReflectionWeek = {
  /** 排序與 React key 用，例如 2026-W34；沒日期的那組是空字串 */
  key: string;
  /** 給人看的那一行，例如 8/17–8/23 */
  label: string;
  year: number;
  items: Reflection[];
};

/**
 * 「2026-08-17」當成當地時區的那一天。
 *
 * 不能直接 new Date(字串)：那會被當成 UTC 午夜，在西半球會倒退一天，
 * 分到上一週去。
 */
export function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(+date) ? null : date;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 週分組底下顯示完整日期只是重複，標「8/17 一」比較有用 */
export function dayLabel(value: string | null): string {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getMonth() + 1}/${date.getDate()} ${WEEKDAYS[date.getDay()]}`;
}

/** ISO 8601 的週：週一開頭，跨年那幾天跟著「哪一年佔比較多天」走 */
function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay() 週日是 0，換算成「離這週的週一過了幾天」
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function isoWeek(monday: Date): { year: number; week: number } {
  // 該週的星期四決定它屬於哪一年，這是 ISO 8601 的定義
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);

  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  const week = Math.round((+thursday - +firstThursday) / (7 * 86400000)) + 1;
  return { year: thursday.getFullYear(), week };
}

function md(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 依週分組。週是回顧最好用的單位——一天太細（會變成打卡），
 * 一個月太粗（看不出「這陣子」在繞什麼）。
 */
export function groupByWeek(reflections: Reflection[]): ReflectionWeek[] {
  const groups = new Map<string, ReflectionWeek>();

  for (const item of reflections) {
    const date = parseDate(item.date);

    if (!date) {
      const group = groups.get("") ?? { key: "", label: "未填日期", year: 0, items: [] };
      group.items.push(item);
      groups.set("", group);
      continue;
    }

    const monday = weekStart(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const { year, week } = isoWeek(monday);
    const key = `${year}-W${String(week).padStart(2, "0")}`;

    const group = groups.get(key) ?? {
      key,
      label: `${md(monday)}–${md(sunday)}`,
      year,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }

  // 由新到舊；沒日期的那組永遠排最後
  return [...groups.values()].sort((a, b) => {
    if (!a.key) return 1;
    if (!b.key) return -1;
    return b.key.localeCompare(a.key);
  });
}

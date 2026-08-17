import { Article } from "@/types/article";
import { Book, splitLines } from "@/types/book";
import { Entry } from "@/types/entry";

export type ReflectionSource = "書籍" | "文章" | "紀事";

/**
 * 一則寫下來的想法，不管它原本掛在書、文章還是紀事上。
 *
 * 這是整個 app 最想回答的問題的材料：「我讀的東西有沒有變成我做出來的東西」、
 * 「我是不是一直在繞同一個問題」——那兩件事只有把三邊攤在同一條時間軸上才看得出來。
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

function fromBooks(books: Book[]): Reflection[] {
  return books
    .filter((b) => b.note.trim())
    .map((b) => ({
      id: b.id,
      source: "書籍" as const,
      title: b.title,
      date: b.endDate ?? b.startDate,
      note: b.note,
      keywords: splitLines(b.keywords),
      href: `/books/${b.id}`,
    }));
}

function fromArticles(articles: Article[]): Reflection[] {
  return articles
    .filter((a) => a.note.trim())
    .map((a) => ({
      id: a.id,
      source: "文章" as const,
      title: a.title,
      date: a.endDate,
      note: a.note,
      keywords: splitLines(a.keywords),
      href: `/articles/${a.id}/edit`,
    }));
}

function fromEntries(entries: Entry[]): Reflection[] {
  return entries
    .filter((e) => e.note.trim())
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

/** 由新到舊；沒填日期的排最後 */
export function getReflections(books: Book[], articles: Article[], entries: Entry[]): Reflection[] {
  return [...fromBooks(books), ...fromArticles(articles), ...fromEntries(entries)].sort((a, b) => {
    const aDate = a.date ?? "";
    const bDate = b.date ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return a.title.localeCompare(b.title, "zh-Hant");
  });
}

export type ReflectionWeek = {
  /** 排序與 React key 用，例如 2026-W34；沒日期的那組是空字串 */
  key: string;
  /** 給人看的那一行，例如 8/17–8/23 */
  label: string;
  year: number;
  items: Reflection[];
};

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
    const date = item.date ? new Date(item.date) : null;
    const valid = date && !isNaN(+date);

    if (!valid) {
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

/** 出現在心得上的關鍵字，依用到的次數排；回顧時先看常繞的那幾個 */
export function getReflectionKeywords(
  reflections: Reflection[],
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of reflections) {
    for (const name of item.keywords) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-Hant"));
}

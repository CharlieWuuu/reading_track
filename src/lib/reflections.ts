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
};

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

import { Book } from "@/types/book";
import { rootId } from "@/utils/book-reads";

/**
 * 08-23 以前的重讀沒有連結：每讀一次是新的一列，但那幾列彼此不知道是同一本書。
 *
 * 這支只負責「看起來像同一本」的判斷，不寫任何東西——書名有錯字、
 * 或真的是不同版本的那種，本來就需要人看一眼再決定。
 */

/** 比對用的正規化：空白與標點的差異不該讓同一本書變成兩本 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[:：\-－—–~～、,，.。!！?？「」『』（）()《》〈〉]/g, "");
}

/** 訊號照可信度排：ISBN 相同最準，只有書名相同最不準 */
export type MatchSignal = "isbn" | "titleAuthor" | "title";

export const SIGNAL_LABEL: Record<MatchSignal, string> = {
  isbn: "ISBN 相同",
  titleAuthor: "書名與作者相同",
  title: "只有書名相同",
};

export interface RereadGroup {
  /** 最舊那一列當源頭；其餘要寫上它的編號 */
  origin: Book;
  others: Book[];
  signal: MatchSignal;
}

/** 沒有日期的排最後：判斷不出先後的那幾列不該搶著當源頭 */
function oldestFirst(a: Book, b: Book): number {
  const left = a.startDate || a.endDate || "";
  const right = b.startDate || b.endDate || "";
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

function keyOf(book: Book, signal: MatchSignal): string | null {
  if (signal === "isbn") return book.isbn.trim() || null;
  const title = normalize(book.title);
  if (!title) return null;
  return signal === "title" ? title : `${title} ${normalize(book.author)}`;
}

/**
 * 找出「看起來是同一本、但還沒連起來」的幾組列。
 *
 * 已經有 originId 的列不參與：那代表人已經判斷過了。同一組裡最舊那一列當源頭，
 * 其餘的才是要補編號的。一本書只會出現在可信度最高的那一組裡——
 * ISBN 對上了就不必再用書名猜一次。
 */
export function findRereadGroups(books: Book[]): RereadGroup[] {
  const claimed = new Set<string>();
  const groups: RereadGroup[] = [];

  for (const signal of ["isbn", "titleAuthor", "title"] as const) {
    const buckets = new Map<string, Book[]>();
    for (const book of books) {
      if (book.originId.trim() || claimed.has(book.id)) continue;
      const key = keyOf(book, signal);
      if (!key) continue;
      buckets.set(key, [...(buckets.get(key) ?? []), book]);
    }

    for (const bucket of buckets.values()) {
      if (bucket.length < 2) continue;
      const [origin, ...others] = [...bucket].sort(oldestFirst);
      for (const book of bucket) claimed.add(book.id);
      groups.push({ origin, others, signal });
    }
  }

  return groups;
}

/** 按下確認之後要寫回去的：每一列指向它那一組的源頭 */
export function toOriginPatches(groups: RereadGroup[]): Map<string, Partial<Book>> {
  return new Map(
    groups.flatMap((group) =>
      group.others.map((book) => [book.id, { originId: rootId(group.origin) }] as const),
    ),
  );
}

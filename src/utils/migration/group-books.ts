import { Book } from "@/types/book";

/**
 * 把 Sheet 上的書籍列歸戶成「一本書」與「讀了幾次」。
 *
 * Sheet 一列扛三件事：一本書、一個版本、一次閱讀。重讀就整列複製一份，
 * 20 欄有 18 欄一樣，再靠 originId 認回去。這裡把那件事拆開。
 *
 * 三個線索，可信度由高到低：
 * 1. originId —— 使用者自己指的，最準
 * 2. 書名加作者 —— 正規化之後比對
 * 3. ISBN —— 只能證明「是同一本」，不能證明「不是」：紙本與電子書各有一組號碼
 */

export interface BookGroup {
  /** 這一組的代表列，書名作者從它來 */
  primary: Book;
  /** 包含代表列自己，照 Sheet 上的順序 */
  rows: Book[];
}

/** 比對用的形狀：去掉空白、大小寫、以及書名裡的副標 */
function fingerprint(book: Book): string {
  const title = book.title
    .split(/[:：（(]/)[0]
    .trim()
    .toLowerCase();
  return `${title} ${book.author.trim().toLowerCase()}`;
}

/** 一列指到哪一組。originId 空的就是自己那一組的開頭 */
function rootIdOf(book: Book): string {
  return book.originId.trim() || book.id;
}

/**
 * originId 只指向最初那一列，不會接成鏈——但 Sheet 是人在編輯的，
 * 指到一列不存在的編號是有可能的。那種列自己獨立成一組，不要整組掉。
 */
function resolveRoot(book: Book, byId: Map<string, Book>): string {
  const root = rootIdOf(book);
  return byId.has(root) ? root : book.id;
}

export function groupBooks(rows: Book[]): BookGroup[] {
  const byId = new Map(rows.map((b) => [b.id, b]));

  // 先照 originId 分組，這是使用者自己指的
  const byRoot = new Map<string, Book[]>();
  for (const row of rows) {
    const root = resolveRoot(row, byId);
    byRoot.set(root, [...(byRoot.get(root) ?? []), row]);
  }

  // 再把書名作者一樣的幾組併起來：originId 是後來才加的欄位，早期重讀沒有指
  const byPrint = new Map<string, string>();
  const merged = new Map<string, Book[]>();
  for (const [root, group] of byRoot) {
    const print = fingerprint(byId.get(root) ?? group[0]);
    const target = byPrint.get(print) ?? root;
    byPrint.set(print, target);
    merged.set(target, [...(merged.get(target) ?? []), ...group]);
  }

  return [...merged.values()].map((group) => ({
    // 代表列取最早開始讀的那一次：書名作者以第一次讀到的為準
    primary: [...group].sort((a, b) => (a.startDate ?? "9").localeCompare(b.startDate ?? "9"))[0],
    rows: group,
  }));
}

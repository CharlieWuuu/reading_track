import { Article } from "@/types/article";
import { Book, splitLines } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { Writing } from "@/types/writing";
import { BookGroup } from "./group-books";

/**
 * Sheet 的形狀轉成資料表的形狀。全部是純函式，不碰網路也不碰資料庫——
 * 匯入腳本只負責讀進來、把結果餵給 insert。
 */

/** 書寫的「類型」欄混了兩種東西：有出處時記的是出處，沒出處時才是真的類型 */
const SOURCE_KINDS = ["書籍", "文章"];

export function isSourceKind(kind: string): boolean {
  return SOURCE_KINDS.includes(kind.trim());
}

export interface TypeNode {
  name: string;
  parent: string | null;
}

/** 領域與次領域攤平成樹的節點清單，父節點排在子節點前面 */
export function typeNodes(rows: { domain: string; subDomain: string }[]): TypeNode[] {
  const parents = new Set<string>();
  const children = new Map<string, string>(); // 子 -> 父

  for (const row of rows) {
    const domain = row.domain.trim();
    const sub = row.subDomain.trim();
    if (!domain) continue;
    parents.add(domain);
    if (sub) children.set(sub, domain);
  }

  return [
    ...[...parents].sort().map((name) => ({ name, parent: null })),
    ...[...children].sort().map(([name, parent]) => ({ name, parent })),
  ];
}

/** 用過的值去重排序。空字串不算 */
export function distinctValues(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort();
}

export interface BookRow {
  title: string;
  author: string;
  language: string;
  typeName: string;
  attributeName: string;
  keywords: string[];
}

export interface ReadingRow {
  status: string;
  startDate: string | null;
  endDate: string | null;
  isbn: string;
  platform: string;
  publisher: string;
  pageCount: number | null;
  wordCount: number | null;
  sourceUrl: string;
  coverUrl: string;
  isPrivate: boolean;
}

/** Sheet 上存字串是為了方便手改，進資料庫要變成數字；不是數字就當沒填 */
export function toInt(value: string): number | null {
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function toDate(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 10) : null;
}

export const PRIVATE_MARK = "是";

/** 一組（同一本書的幾次閱讀）攤成一列 books 與多列 readings */
export function toBookAndReadings(group: BookGroup): { book: BookRow; readings: ReadingRow[] } {
  const primary = group.primary;
  return {
    book: {
      title: primary.title.trim(),
      author: primary.author.trim(),
      language: primary.language.trim(),
      typeName: (primary.subDomain.trim() || primary.domain.trim()).trim(), // 掛在最細的那一層
      attributeName: splitLines(primary.type)[0]?.trim() ?? "", // 改成單選，多值取第一個
      keywords: distinctValues(group.rows.flatMap((r) => splitLines(r.keywords))),
    },
    readings: group.rows.map((row) => ({
      status: row.status.trim(),
      startDate: toDate(row.startDate),
      endDate: toDate(row.endDate),
      isbn: row.isbn.trim(),
      platform: row.platform.trim(),
      publisher: row.publisher.trim(),
      pageCount: toInt(row.pageCount),
      wordCount: toInt(row.wordCount),
      sourceUrl: row.sourceUrl.trim(),
      coverUrl: row.coverUrl.trim(),
      isPrivate: row.private.trim() === PRIVATE_MARK,
    })),
  };
}

export interface WritingRow {
  title: string;
  note: string;
  date: string | null;
  link: string;
  typeName: string;
  isPrivate: boolean;
  sourceId: string; // Sheet 上的舊編號，插入前換成新的 uuid
  keywords: string[];
}

export function toWriting(row: Writing): WritingRow {
  return {
    title: row.title.trim(),
    note: row.note,
    date: toDate(row.date),
    link: row.link.trim(),
    // 「書籍」「文章」是出處不是類型，出處由外鍵記，這裡留空
    typeName: isSourceKind(row.kind) ? "" : row.kind.trim(),
    isPrivate: row.private.trim() === PRIVATE_MARK,
    sourceId: row.sourceId.trim(),
    keywords: distinctValues(splitLines(row.keywords)),
  };
}

export function toArticle(row: Article) {
  return {
    title: row.title.trim(),
    author: row.author.trim(),
    platform: row.platform.trim(),
    sourceUrl: row.sourceUrl.trim(),
    endDate: toDate(row.endDate),
    language: row.language.trim(),
    typeName: (row.subDomain.trim() || row.domain.trim()).trim(),
    attributeName: splitLines(row.type)[0]?.trim() ?? "",
    isPrivate: row.private.trim() === PRIVATE_MARK,
    keywords: distinctValues(splitLines(row.keywords)),
  };
}

export function toQuote(row: QuoteRow) {
  return {
    bookId: row.bookId.trim(),
    text: row.text,
    chapter: row.chapter.trim(),
    note: row.note,
  };
}

export function toVocabulary(row: VocabularyRow) {
  return {
    bookId: row.bookId.trim(),
    word: row.word.trim(),
    pronunciation: row.pronunciation.trim(),
    wordTranslation: row.wordTranslation.trim(),
    sentence: row.sentence,
    sentenceTranslation: row.sentenceTranslation,
    chapter: row.chapter.trim(),
    language: row.language.trim(),
  };
}

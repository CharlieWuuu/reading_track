import { Book } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";

export type VocabularyEncounter = VocabularyRow & {
  bookCover: string;
};

export type VocabularyEntry = {
  word: string;
  /** 同一個詞在不同書裡是不同的相遇，所以一本一筆、不合併 */
  encounters: VocabularyEncounter[];
};

/**
 * 書名與語言都以書籍表為準：紀錄表上的書名只是給人看的快照，
 * 書改名之後那一欄可能還是舊的，顯示要用活的那一份。
 */
function withBook<T extends { bookId: string; bookTitle: string }>(
  row: T,
  books: Map<string, Book>,
): T & { bookCover: string } {
  const book = books.get(row.bookId);
  return { ...row, bookTitle: book?.title || row.bookTitle, bookCover: book?.coverUrl ?? "" };
}

export function getVocabularyEntries(rows: VocabularyRow[], books: Book[]): VocabularyEntry[] {
  const byId = new Map(books.map((book) => [book.id, book]));
  const map = new Map<string, VocabularyEncounter[]>();

  for (const row of rows) {
    const encounter = {
      ...withBook(row, byId),
      // 沒填就跟著書走，這是絕大多數的情況
      language: row.language || byId.get(row.bookId)?.language || "",
    };
    const list = map.get(row.word);
    if (list) list.push(encounter);
    else map.set(row.word, [encounter]);
  }

  return [...map.entries()]
    .map(([word, encounters]) => ({ word, encounters }))
    .sort(
      (a, b) =>
        b.encounters.length - a.encounters.length || a.word.localeCompare(b.word, "zh-Hant"),
    );
}

/** 目前真的有單字在用的語言。選項只列有東西的，選了才不會篩出一片空白 */
export function vocabularyLanguages(entries: VocabularyEntry[]): string[] {
  return [
    ...new Set(entries.flatMap((entry) => entry.encounters.map((e) => e.language).filter(Boolean))),
  ].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

/**
 * 依語言篩。空字串是「全部」。
 *
 * 只要有一次相遇是這個語言就留下——同一個詞可能在中文書裡當外來語出現過，
 * 那也是「這個語言的單字」。
 */
export function filterVocabularyByLanguage(
  entries: VocabularyEntry[],
  language: string,
): VocabularyEntry[] {
  if (!language) return entries;
  return entries.filter((entry) => entry.encounters.some((e) => e.language === language));
}

export type QuoteRecord = QuoteRow & { bookCover: string };

export function getQuoteRecords(rows: QuoteRow[], books: Book[]): QuoteRecord[] {
  const byId = new Map(books.map((book) => [book.id, book]));
  return rows.map((row) => withBook(row, byId));
}

export type NoteRecord = {
  note: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
};

/** 心得一本一則，還是書籍表的欄位；沒寫的不列 */
export function getNoteRecords(books: Book[]): NoteRecord[] {
  return books
    .filter((book) => book.note.trim())
    .map((book) => ({
      note: book.note,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverUrl,
    }));
}

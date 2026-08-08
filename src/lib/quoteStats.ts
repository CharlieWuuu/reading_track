import { Book, parseQuotes } from "@/types/book";

export type QuoteRecord = {
  text: string;
  chapter: string;
  /** 這一句的心得，跟整本書的心得分開 */
  note: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  /** 在那本書的佳句欄裡是第幾行；要改回去就得知道改哪一行 */
  index: number;
};

/** 所有書的佳句攤平成一片，新讀完的書排前面（書單本身已經排好序） */
export function getQuoteRecords(books: Book[]): QuoteRecord[] {
  return books.flatMap((book) =>
    parseQuotes(book.quotes).map((quote, index) => ({
      text: quote.text,
      chapter: quote.chapter,
      note: quote.note,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverUrl,
      index,
    })),
  );
}

export type NoteRecord = {
  note: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
};

/** 心得一本一則，沒寫的不列 */
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

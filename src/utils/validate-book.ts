import { Book } from "@/types/book";

export interface BookIssue {
  bookId: string;
  title: string;
  field: keyof Book;
  message: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

/**
 * 檢查資料上常見的小問題（多半是從試算表搬過來時留下的）。
 * 這些只是提示，不會擋住任何操作，也不會自動改資料。
 */
export function validateBook(book: Book): BookIssue[] {
  const issues: BookIssue[] = [];
  const label = book.title || "（未命名書籍）";
  const add = (field: keyof Book, message: string) =>
    issues.push({ bookId: book.id, title: label, field, message });

  if (!book.title.trim()) {
    add("title", "沒有書名，統計時會被略過");
  }

  for (const field of ["startDate", "endDate"] as const) {
    const value = book[field];
    if (value && !isValidDate(value)) {
      const name = field === "startDate" ? "開始日期" : "完成日期";
      add(field, `${name}「${value}」不是 YYYY-MM-DD 格式`);
    }
  }

  if (
    book.startDate &&
    book.endDate &&
    isValidDate(book.startDate) &&
    isValidDate(book.endDate) &&
    book.endDate < book.startDate
  ) {
    add("endDate", "完成日期早於開始日期");
  }

  for (const field of ["pageCount", "wordCount"] as const) {
    const value = book[field];
    if (value && !/^\d+$/.test(value.replace(/,/g, ""))) {
      const name = field === "pageCount" ? "頁數" : "字數";
      add(field, `${name}「${value}」不是數字`);
    }
  }

  if (book.sourceUrl && !/^https?:\/\//.test(book.sourceUrl)) {
    add("sourceUrl", "來源網址看起來不是有效的連結");
  }

  return issues;
}

// 同名書籍是正常的（不同版本、重讀、系列書），不列為問題。
export function validateBooks(books: Book[]): BookIssue[] {
  return books.flatMap(validateBook);
}

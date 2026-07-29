import { Book, normalizePlatform } from "@/types/book";

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
 * 檢查使用者直接在 Sheet 裡改出來的小問題。
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

  if (book.platform && !normalizePlatform(book.platform)) {
    add("platform", `平台「${book.platform}」不在選項內，會被歸到「其他」`);
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

export function validateBooks(books: Book[]): BookIssue[] {
  const issues = books.flatMap(validateBook);

  const seen = new Map<string, string>();
  for (const book of books) {
    if (!book.title.trim()) continue;
    const key = book.title.trim().toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      issues.push({
        bookId: book.id,
        title: book.title,
        field: "title",
        message: "有另一筆同名書籍，可能重複了",
      });
    } else {
      seen.set(key, book.id);
    }
  }

  return issues;
}

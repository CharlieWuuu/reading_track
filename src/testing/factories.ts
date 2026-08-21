import { Article } from "@/types/article";
import { Book } from "@/types/book";
import { Entry } from "@/types/entry";

/**
 * 測試用的假資料。
 *
 * 型別逼你把每個欄位都填滿，但測試只在乎其中一兩個——工廠給合理的預設值，
 * 測試只寫它真正在測的那幾欄，讀的人一眼就知道重點在哪：
 *
 *   makeBook({ pageCount: "三百" })  // 這個測試只關心頁數不是數字
 *
 * 預設值刻意用「乾淨的一本書」：沒有私人標記、日期合法、數字是數字。
 * 要測壞資料就自己覆蓋，不要反過來讓預設值帶著問題。
 */

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

/** 每個測試檔各自從 1 開始編號，才不會因為執行順序不同而對不上 */
export function resetIds() {
  seq = 0;
}

export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: nextId("book"),
    title: "測試書名",
    author: "測試作者",
    coverUrl: "",
    publisher: "",
    platform: "紙本",
    sourceUrl: "",
    status: "已讀完",
    startDate: "2026-08-01",
    endDate: "2026-08-10",
    domain: "心理",
    subDomain: "",
    type: "閒書",
    language: "中文",
    pageCount: "300",
    wordCount: "",
    note: "",
    quotes: "",
    keywords: "",
    private: "",
    relatedArticles: "",
    vocabulary: "",
    ...overrides,
  };
}

export function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: nextId("article"),
    title: "測試文章",
    author: "",
    platform: "報導者",
    sourceUrl: "https://example.com/a",
    endDate: "2026-08-10",
    domain: "社會",
    subDomain: "",
    type: "閒書",
    language: "中文",
    note: "",
    keywords: "",
    private: "",
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: nextId("entry"),
    date: "2026-08-10",
    title: "測試紀事",
    kind: "書籍",
    keywords: "",
    note: "寫了一句話",
    link: "",
    sourceTitle: "",
    sourceId: "",
    private: "",
    ...overrides,
  };
}

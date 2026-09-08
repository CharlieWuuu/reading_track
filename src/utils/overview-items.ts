import { Article } from "@/types/article";
import { Book } from "@/types/book";
import { Writing } from "@/types/writing";
import { OverviewItem } from "./overview";

/**
 * 各種形狀攤成概覽用的一筆。純轉換，不查資料。
 *
 * 攤平的理由是概覽要混排：紀錄那一頁同時有書籍與文章，之後還會有電影。
 * 每一支只負責「這種東西的標題是什麼、副標寫什麼、點了去哪裡」。
 */

const joinByline = (parts: (string | number | null | undefined | false)[]) =>
  parts.filter(Boolean).join("　·　");

export const bookItem = (book: Book): OverviewItem => ({
  id: book.id,
  title: book.title,
  byline: joinByline([book.author, book.domain, book.pageCount && `${book.pageCount} 頁`]),
  href: `/reading/books/${book.id}`,
  coverUrl: book.coverUrl,
  startDate: book.startDate,
  endDate: book.endDate && `${book.endDate} 讀完`,
  kindLabel: "書籍",
});

export const articleItem = (article: Article): OverviewItem => ({
  id: article.id,
  title: article.title,
  byline: joinByline([article.author, article.platform, article.domain]),
  href: `/reading/articles/${article.id}`,
  // 沒有封面欄位就整個不畫，不要留一塊空的佔位
  startDate: null,
  endDate: article.endDate && `${article.endDate} 讀完`,
  kindLabel: "文章",
});

export const writingItem = (writing: Writing): OverviewItem => ({
  id: writing.id,
  title: writing.title,
  byline: joinByline([writing.kind, writing.keywords.split("\n")[0]]),
  href: `/writing/${writing.id}`,
  startDate: writing.date,
  endDate: writing.date && `${writing.date}`,
  kindLabel: "書寫",
});

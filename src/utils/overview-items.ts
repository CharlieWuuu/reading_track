import { RecordRow } from "@/lib/db/queries/catalog";
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

/** 內建類型的詳細頁。自訂類型還沒有，點了退回那一種的清單 */
const DETAIL_HREF: Record<string, (id: string) => string> = {
  書籍: (id) => `/reading/books/${id}`,
  文章: (id) => `/reading/articles/${id}`,
};

/**
 * 新表的一筆紀錄。書籍、文章、電影都走這一支——欄位是共用的，
 * 差別只有類型名，那個由 kindName 帶著走。
 */
export const recordItem = (row: RecordRow): OverviewItem => ({
  id: row.id,
  title: row.title,
  byline: joinByline([row.creator, row.source, row.amount && `${row.amount} ${row.amountUnit}`]),
  // 編號沿用舊表，所以舊的詳細頁直接接得上；電影那類還沒有詳細頁，退回類型清單
  href: DETAIL_HREF[row.kindName]?.(row.id) ?? `/reading/k/${row.kindId}`,
  coverUrl: row.coverUrl || undefined,
  startDate: row.startDate,
  endDate: row.endDate && `${row.endDate} 完成`,
  kindLabel: row.kindName,
});

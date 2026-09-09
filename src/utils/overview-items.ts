import { kindHref } from "@/config/kind-routes";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
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
  href: `${kindHref("records", "books")}/${book.id}`,
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
  書籍: (id) => `${kindHref("records", "books")}/${id}`,
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
  href: DETAIL_HREF[row.kindName]?.(row.id) ?? `/reading/k/${row.kindId}/${row.id}`,
  coverUrl: row.coverUrl || undefined,
  startDate: row.startDate,
  endDate: row.endDate && `${row.endDate} 完成`,
  kindLabel: row.kindName,
});

/**
 * 片段與專欄的一筆。標題是「有名字就用名字，沒有就用內文開頭」——
 * 一句佳句沒有標題，硬留白會讓整排清單只剩出處看得見。
 */
export const fragmentItem = (row: FragmentRow): OverviewItem => {
  const day = row.date ?? row.createdAt.slice(0, 10);
  return {
    id: row.id,
    title: row.name || row.body.slice(0, 40),
    byline: joinByline([row.workTitle, row.locator]),
    href: FRAGMENT_HREF[row.kindName]?.(row) ?? `/reading/k/${row.kindId}`,
    // 生成塊放什麼字跟著有沒有標題走：單字、關鍵字有名字就放名字；
    // 佳句、日記這類一句話／長文的沒有標題，生成塊留白不硬塞內文開頭
    bandLabel: row.name || undefined,
    startDate: day,
    endDate: day,
    kindLabel: row.kindName,
  };
};

/** 內建片段的詳細頁。單字用詞條當網址，那是舊路由的約定 */
const FRAGMENT_HREF: Record<string, (row: FragmentRow) => string> = {
  佳句: (row) => `/reading/quotes/${row.id}`,
  單字: (row) => `/reading/vocabulary/${encodeURIComponent(row.name)}`,
  書寫: (row) => `/writing/${row.id}`,
};

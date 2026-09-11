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
  parts.filter(Boolean).join("・");

export const bookItem = (book: Book): OverviewItem => ({
  id: book.id,
  title: book.title,
  byline: joinByline([book.author, book.domain, book.pageCount && `${book.pageCount} 頁`]),
  href: `${kindHref("records", "books")}/${book.id}`,
  coverUrl: book.coverUrl,
  startDate: book.startDate,
  endDate: book.endDate,
  kindLabel: "書籍",
});

export const articleItem = (article: Article): OverviewItem => ({
  id: article.id,
  title: article.title,
  byline: joinByline([article.author, article.platform, article.domain]),
  href: `${kindHref("records", "articles")}/${article.id}`,
  // 沒有封面欄位就整個不畫，不要留一塊空的佔位
  startDate: null,
  endDate: article.endDate,
  kindLabel: "文章",
});

export const writingItem = (writing: Writing): OverviewItem => ({
  id: writing.id,
  title: writing.title || writing.note,
  byline: writing.note,
  href: `${kindHref("writings", "writing")}/${writing.id}`,
  coverUrl: writing.coverUrl,
  startDate: writing.date,
  endDate: writing.date && `${writing.date}`,
  kindLabel: writing.topic,
});

/**
 * 新表的一筆紀錄。書籍、文章、電影都走這一支——欄位是共用的，
 * 差別只有類型名，那個由 kindName 帶著走。
 *
 * 網址一律用 kindHref(group, slug)：內建類型現在也走 [slug] 通用頁了，
 * 不用再另外對照一張「內建類型的詳細頁」。
 */
export const recordItem = (row: RecordRow): OverviewItem => ({
  id: row.id,
  title: row.title,
  byline: joinByline([row.creator, row.source, row.amount && `${row.amount} ${row.amountUnit}`]),
  href: `${kindHref(row.kindGroup, row.kindSlug)}/${row.id}`,
  coverUrl: row.coverUrl || undefined,
  startDate: row.startDate,
  endDate: row.endDate,
  kindLabel: row.kindName,
});

/**
 * 片段自己的網址要接哪一段 id。單字用詞本身（同一個詞可能好幾列，那一頁一次改完）；
 * 關鍵字沒有逐筆的詳細頁（卡片彈窗式），點了退回那一種的清單；其餘片段用編號。
 *
 * 認 slug 不認名字——名字使用者改得掉，改完這張表就對不上了。
 */
const FRAGMENT_HREF: Record<string, (row: FragmentRow) => string> = {
  vocabulary: (row) => `${kindHref(row.kindGroup, row.kindSlug)}/${encodeURIComponent(row.name)}`,
  keywords: (row) => kindHref(row.kindGroup, row.kindSlug),
};

export const fragmentHref = (row: FragmentRow): string =>
  FRAGMENT_HREF[row.kindSlug]?.(row) ?? `${kindHref(row.kindGroup, row.kindSlug)}/${row.id}`;

/** 片段的標題：有名字就用名字，沒有就用整段內文——一句佳句沒有標題，硬留白只剩出處看得見 */
export const fragmentTitle = (row: FragmentRow): string => row.name || row.body;

/** 片段的出處：書名・頁碼之類 */
export const fragmentMeta = (row: FragmentRow): string => joinByline([row.workTitle, row.locator]);

/**
 * 片段與專欄的一筆，攤平成概覽用的形狀。
 */
export const fragmentItem = (row: FragmentRow): OverviewItem => {
  const day = row.date ?? row.createdAt.slice(0, 10);
  return {
    id: row.id,
    title: fragmentTitle(row),
    byline: fragmentMeta(row),
    href: fragmentHref(row),
    startDate: day,
    endDate: day,
    kindLabel: row.kindName,
  };
};

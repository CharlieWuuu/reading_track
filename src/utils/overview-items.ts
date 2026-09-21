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
  href: `${"/writings/writing"}/${writing.id}`,
  coverUrl: writing.coverUrl,
  startDate: writing.endDate,
  endDate: writing.endDate && `${writing.endDate}`,
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
  byline: joinByline([row.creator, row.platform, row.amount && `${row.amount} ${row.amountUnit}`]),
  href: `${kindHref(row.kindGroup, row.kindSlug)}/${row.id}`,
  coverUrl: row.coverUrl || undefined,
  startDate: row.startDate,
  endDate: row.endDate,
  kindLabel: row.kindName,
});

/**
 * 片段自己的網址。一律用編號——每一筆本來就有自己的 id。
 *
 * 單字本來也用「詞」，配合那支專屬頁（寫死七格、不讀模組設定）。頁拆掉了，
 * 資料也早就一列一筆、沒有重複的詞，所以改用編號——拿詞去查 catalog 查不到，
 * 畫面會卡在載入中，點下去像沒反應。
 *
 * 關鍵字還是用詞：它的主檔以名字當身分、沒有 id，專屬頁也還在。
 * 等那條資料路帶出 id，這個例外就拿掉。
 */
export const fragmentHref = (row: FragmentRow): string =>
  row.kindSlug === "keywords"
    ? `${kindHref(row.kindGroup, row.kindSlug)}/${encodeURIComponent(row.title)}`
    : `${kindHref(row.kindGroup, row.kindSlug)}/${row.id}`;

/** 片段的標題：有名字就用名字，沒有就用整段內文——一句佳句沒有標題，硬留白只剩出處看得見 */
export const fragmentTitle = (row: FragmentRow): string => row.title || row.body;

/**
 * 卡片上那段內文。有例句就秀例句——「這個字長什麼樣」比字義本身好記，
 * 單字專屬頁（VocabularySection）本來就這樣畫，通用清單跟上。
 */
export const fragmentBody = (row: FragmentRow): string => row.example || row.body;

/**
 * 片段的出處：書名・頁碼之類。
 *
 * 書寫沒有出處那一層，改用內文開頭——卡片上總要看得出這則在寫什麼，
 * 只有標題的話一整面卡片長得都一樣。
 *
 * 不繼承封面的類型也不寫出處：單字、關鍵字不屬於任何一本書，掛上書名
 * 跟掛上書封是同一種誤導。判斷跟封面共用 inheritsCover，不另外開欄位。
 */
export const fragmentMeta = (row: FragmentRow): string => {
  if (row.kindGroup === "writings") return row.body;
  if (!row.inheritsCover) return "";
  return joinByline([row.workTitle, row.locator]);
};

/**
 * 卡片標題右邊那行綠字：有字義就秀字義，沒有就空白。
 *
 * 不退回類型名——在單字頁那一整面都是單字，寫「單字」等於沒說；
 * 在片段概覽每張卡上面本來就有分區標題，也已經說了這一區是哪一種。
 */
export const fragmentLabel = (row: FragmentRow): string => row.translation;

/**
 * 片段的一筆攤成卡片要的 props。
 *
 * 通用清單、片段概覽的分區、單字專屬頁本來各自組一份，欄位給得不一樣——
 * 同一張單字卡在片段頁有出處、在單字頁沒有。一支說了算。
 */
export const fragmentCard = (row: FragmentRow) => ({
  href: fragmentHref(row),
  title: fragmentTitle(row),
  label: fragmentLabel(row),
  body: fragmentBody(row),
  detail: row.pronunciation || undefined,
  meta: fragmentMeta(row),
  coverUrl: row.coverUrl,
});

/**
 * 片段與書寫的一筆，攤平成概覽用的形狀。
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
    coverUrl: row.coverUrl,
  };
};

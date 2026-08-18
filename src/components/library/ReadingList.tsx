"use client";

import Link from "next/link";
import { PageMessage } from "@/components/layout/PageMessage";
import { TagList } from "@/components/ui/TagBadge";
import { Article } from "@/types/article";
import { Book, splitLines, splitTags } from "@/types/book";

const styles = {
  // overflow-hidden：hover 底色才會被圓角裁掉，不會在頭尾兩列破圖
  // shrink-0：overflow 一旦不是 visible，flex 子項就會被壓扁，清單長了也捲不到
  // 桌機只捲清單本身，外框與圓角留在原地；手機仍是整頁捲
  list: "shrink-0 divide-y overflow-hidden rounded-lg border bg-white md:min-h-0 md:flex-1 md:overflow-y-auto",
  row: "flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 sm:gap-4 sm:px-4 sm:py-3",
  cover: "h-9 w-6 shrink-0 rounded-sm object-cover",
  blank: "h-9 w-6 shrink-0 rounded-sm bg-gray-100",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  title: "truncate text-sm font-medium whitespace-nowrap",
  // 日期、來源與標籤同一列；手機寬度不夠時標籤會換到下一行
  meta: "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
  text: "shrink-0 truncate text-xs text-gray-500",
  tags: "min-w-0 overflow-hidden",
};

/** 書與文章攤平成同一種列，時間軸才排得起來 */
export type ReadingItem = {
  id: string;
  kind: "book" | "article";
  title: string;
  /** 排序與顯示都用它；書沒讀完就退回開始日期 */
  date: string | null;
  coverUrl: string;
  /** 日期後面那串：出版社／站台、作者 */
  meta: string[];
  tags: string[];
  href: string;
};

export function toReadingItems(books: Book[], articles: Article[]): ReadingItem[] {
  const fromBooks: ReadingItem[] = books.map((b) => ({
    id: b.id,
    kind: "book",
    title: b.title,
    date: b.endDate ?? b.startDate,
    coverUrl: b.coverUrl,
    meta: [b.author, b.publisher].filter(Boolean),
    tags: [...splitTags(b.type), ...splitLines(b.keywords)],
    href: `/books/${b.id}`,
  }));

  const fromArticles: ReadingItem[] = articles.map((a) => ({
    id: a.id,
    kind: "article",
    title: a.title,
    date: a.endDate,
    coverUrl: "",
    meta: [a.platform, a.author].filter(Boolean),
    tags: [...splitTags(a.type), ...splitLines(a.keywords)],
    href: `/articles/${a.id}/edit`,
  }));

  // 由新到舊；還沒讀完的（沒日期）排最後
  return [...fromBooks, ...fromArticles].sort((x, y) => {
    const a = x.date ?? "";
    const b = y.date ?? "";
    if (a !== b) return b.localeCompare(a);
    return x.title.localeCompare(y.title, "zh-Hant");
  });
}

/** 書與文章混排的清單。書有封面、文章留一個同寬的空位，兩邊的標題才對得齊 */
export function ReadingList({ items }: { items: ReadingItem[] }) {
  if (items.length === 0) {
    return <PageMessage>符合條件的紀錄是空的</PageMessage>;
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <Link key={`${item.kind}-${item.id}`} href={item.href} className={styles.row}>
          {item.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.coverUrl} alt="" className={styles.cover} />
          ) : (
            <div className={styles.blank} />
          )}

          <div className={styles.body}>
            <p className={styles.title}>{item.title}</p>
            <div className={styles.meta}>
              <span className={styles.text}>
                {[item.date || "未完讀", ...item.meta].join(" · ")}
              </span>
              {item.tags.length > 0 && (
                <div className={styles.tags}>
                  <TagList values={item.tags} tone="article" wrap={false} />
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

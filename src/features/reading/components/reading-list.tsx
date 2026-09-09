"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageMessage } from "@/components/layout/page-message";
import { Favicon } from "@/components/ui/favicon";
import { TagList } from "@/components/ui/tag-badge";
import { articleHref } from "@/config/routes";
import { BookViewMode } from "@/stores/use-book-view-store";
import { Article } from "@/types/article";
import { splitLines, splitTags } from "@/types/book";

const styles = {
  // 桌機只捲清單本身，外框留在原地；手機仍是整頁捲。跟書籍表格同一套細線風格，
  // 不用圓角卡片框
  list: "border-rule-strong shrink-0 border-t md:min-h-0 md:flex-1 md:overflow-y-auto",
  row: "border-rule flex items-center gap-3 border-b py-3",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  title: "font-serif text-item-sm truncate font-semibold tracking-tight",
  // 日期、站台與標籤同一列；手機寬度不夠時標籤會換到下一行
  meta: "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
  text: "text-meta text-ink-faint shrink-0 truncate",
  tags: "min-w-0 overflow-hidden",
};

function articleTags(a: Article) {
  // 屬性是多值、關鍵字是一行一筆，兩種都當標籤秀
  return [...splitTags(a.type), ...splitLines(a.keywords)];
}

/** 手機版與卡片檢視共用的一列：文章沒有封面，一列就是標題加一行資訊 */
function CompactRow({ article }: { article: Article }) {
  const tags = articleTags(article);
  return (
    <Link href={articleHref(article.id)} className={styles.row}>
      {/* 文章沒有封面，站台圖示至少讓「這是哪裡的文章」一眼認得出來 */}
      <Favicon url={article.sourceUrl} fallback={article.platform || article.title} />
      <div className={styles.body}>
        <p className={styles.title}>{article.title}</p>
        <div className={styles.meta}>
          <span className={styles.text}>
            {[article.endDate || "未完讀", article.platform, article.author]
              .filter(Boolean)
              .join("・")}
          </span>
          {tags.length > 0 && (
            <div className={styles.tags}>
              <TagList values={tags} tone="article" wrap={false} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/** 卡片牆：一次看很多篇，標題吃兩行，其餘壓成一行小字。跟書籍書封牆同一套細線風格 */
function ArticleCards({ articles }: { articles: Article[] }) {
  return (
    // 手機就兩欄起跳，寬螢幕一路加到四欄；卡片本來就只有標題與一行小字，不需要很寬
    <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((a) => (
        <li key={a.id} className="border-rule border-b pb-3">
          <Link href={articleHref(a.id)} className="flex h-full flex-col gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <Favicon
                url={a.sourceUrl}
                fallback={a.platform || a.title}
                className="mt-0.5 size-5"
              />
              <p className="text-item-sm line-clamp-2 min-w-0 flex-1 font-serif leading-snug font-semibold tracking-tight">
                {a.title}
              </p>
            </div>
            <p className="text-meta text-ink-faint truncate">
              {[a.endDate || "未完讀", a.platform, a.author].filter(Boolean).join("・")}
            </p>
            {articleTags(a).length > 0 && (
              <div className="mt-auto min-w-0 overflow-hidden">
                <TagList values={articleTags(a)} tone="article" wrap={false} />
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 桌機表格：欄位對齊才看得出「這陣子都讀哪類的東西」。跟書籍表格同一套細線風格 */
function ArticleTable({ articles }: { articles: Article[] }) {
  const router = useRouter();
  return (
    <div className="hidden min-h-0 w-full flex-1 overflow-y-auto md:block">
      <table className="w-full table-fixed">
        <thead className="border-rule-strong bg-background sticky top-0 z-10 border-b text-left">
          <tr className="text-label text-ink-faint tracking-label [&_th]:font-normal">
            <th className="w-[4%] px-3 py-2 whitespace-nowrap">站台</th>
            <th className="w-[30%] px-3 py-2 whitespace-nowrap">標題</th>
            <th className="w-[14%] px-3 py-2 whitespace-nowrap">作者</th>
            <th className="w-[12%] px-3 py-2 whitespace-nowrap">來源</th>
            <th className="w-[12%] px-3 py-2 whitespace-nowrap">完成日期</th>
            <th className="hidden w-[12%] px-3 py-2 whitespace-nowrap lg:table-cell">領域</th>
            <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap xl:table-cell">屬性</th>
            <th className="hidden w-[6%] px-3 py-2 whitespace-nowrap 2xl:table-cell">語言</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr
              key={a.id}
              onClick={() => router.push(articleHref(a.id))}
              className="border-rule hover:bg-control-bg-hover/5 cursor-pointer border-t first:border-t-0"
            >
              <td className="px-3 py-2">
                <Favicon url={a.sourceUrl} fallback={a.platform || a.title} className="size-5" />
              </td>
              <td className="max-w-0 overflow-hidden px-3 py-2">
                <span className="text-item-sm block overflow-hidden font-serif font-semibold tracking-tight text-ellipsis whitespace-nowrap">
                  {a.title}
                </span>
              </td>
              <td className="text-byline text-ink-muted max-w-0 overflow-hidden px-3 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                  {a.author}
                </span>
              </td>
              <td className="text-byline text-ink-muted max-w-0 overflow-hidden px-3 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                  {a.platform}
                </span>
              </td>
              <td className="text-meta text-ink-faint px-3 py-2 whitespace-nowrap tabular-nums">
                {a.endDate || "—"}
              </td>
              {/* max-w-0 + overflow-hidden：table-fixed 下標籤太寬會擠進隔壁欄，寧可切掉 */}
              <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                <TagList values={[a.domain]} tone="domain" wrap={false} />
              </td>
              <td className="hidden max-w-0 overflow-hidden px-3 py-2 xl:table-cell">
                <TagList values={[a.type]} tone="type" wrap={false} />
              </td>
              <td className="text-byline text-ink-muted hidden max-w-0 overflow-hidden px-3 py-2 2xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                  {a.language}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 文章清單。跟書籍一樣有表格與卡片兩種檢視，只是沒有封面可以看 */
export function ReadingList({ articles, view }: { articles: Article[]; view: BookViewMode }) {
  if (articles.length === 0) {
    return <PageMessage fill>還沒有記下任何文章</PageMessage>;
  }

  if (view === "card") return <ArticleCards articles={articles} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 手機版：欄位太多的表格在小螢幕上不好讀，改回一列一篇 */}
      <div className={`${styles.list} md:hidden`}>
        {articles.map((a) => (
          <CompactRow key={a.id} article={a} />
        ))}
      </div>
      <ArticleTable articles={articles} />
    </div>
  );
}

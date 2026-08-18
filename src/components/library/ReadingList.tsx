"use client";

import Link from "next/link";
import { PageMessage } from "@/components/layout/PageMessage";
import { TagList } from "@/components/ui/TagBadge";
import { Article } from "@/types/article";
import { splitLines, splitTags } from "@/types/book";

const styles = {
  // overflow-hidden：hover 底色才會被圓角裁掉，不會在頭尾兩列破圖
  // shrink-0：overflow 一旦不是 visible，flex 子項就會被壓扁，清單長了也捲不到
  // 桌機只捲清單本身，外框與圓角留在原地；手機仍是整頁捲
  list: "shrink-0 divide-y overflow-hidden rounded-lg border bg-white md:min-h-0 md:flex-1 md:overflow-y-auto",
  row: "flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 sm:gap-4 sm:px-4 sm:py-3",
  body: "flex min-w-0 flex-1 flex-col gap-1",
  title: "truncate text-sm font-medium whitespace-nowrap",
  // 日期、站台與標籤同一列；手機寬度不夠時標籤會換到下一行
  meta: "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
  text: "shrink-0 truncate text-xs text-gray-500",
  tags: "min-w-0 overflow-hidden",
};

/** 文章清單。書籍有自己的表格與書封兩種檢視，不共用這個 */
export function ReadingList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return <PageMessage>還沒有記下任何文章</PageMessage>;
  }

  return (
    <div className={styles.list}>
      {articles.map((a) => {
        // 屬性是多值、關鍵字是一行一筆，兩種都當標籤秀
        const tags = [...splitTags(a.type), ...splitLines(a.keywords)];
        return (
          <Link key={a.id} href={`/articles/${a.id}/edit`} className={styles.row}>
            <div className={styles.body}>
              <p className={styles.title}>{a.title}</p>
              <div className={styles.meta}>
                <span className={styles.text}>
                  {[a.endDate || "未完讀", a.platform, a.author].filter(Boolean).join(" · ")}
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
      })}
    </div>
  );
}

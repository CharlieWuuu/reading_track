"use client";

import { useCategories } from "@/hooks/use-categories";
import { BookCategories } from "@/types/book";

const LABELS: Record<keyof BookCategories, string> = {
  platform: "平台",
  domain: "領域",
  subDomain: "次領域",
  type: "屬性",
  language: "語言",
  articleDomain: "文章領域",
  articleSubDomain: "文章次領域",
  kind: "類型",
};

const styles = {
  wrap: "space-y-5",
  hint: "text-xs text-gray-500",
  group: "flex flex-col gap-1",
  title: "text-sm font-medium",
  list: "flex flex-wrap gap-1.5",
  item: "flex items-baseline gap-1 rounded-control border px-2 py-1 text-xs text-gray-600",
  count: "text-[10px] text-gray-400 tabular-nums",
  empty: "text-xs text-gray-400",
};

/**
 * 分類不再是一份要維護的清單，而是「我實際用過哪些值」。
 *
 * 全部從書、文章、書寫 group 出來，用得多的排前面。想改一個值就去改那筆紀錄，
 * 這裡沒有東西可以編——沒有清單，就不會有「清單跟資料對不上」這回事。
 */
export function CategoryManager() {
  const { categories, counts } = useCategories();

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        這些選項是從你的紀錄裡整理出來的，不是一份要維護的清單。用得多的排前面；
        想改掉某個值，直接改那筆紀錄就好。
      </p>

      {(Object.keys(LABELS) as (keyof BookCategories)[]).map((key) => (
        <div key={key} className={styles.group}>
          <h4 className={styles.title}>{LABELS[key]}</h4>
          {categories[key].length === 0 ? (
            <p className={styles.empty}>還沒有用過任何值</p>
          ) : (
            <div className={styles.list}>
              {categories[key].map((option) => (
                <span key={option} className={styles.item}>
                  {option}
                  <span className={styles.count}>{counts[key].get(option) ?? 0}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

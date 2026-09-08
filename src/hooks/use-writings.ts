"use client";

import { useCollection } from "@/hooks/use-collection";
import { Writing } from "@/types/writing";

/**
 * 由新到舊；沒填日期的排最後。
 *
 * 同一天照當初寫下的先後，遞增——書籍與文章是晚記的在前，這裡刻意相反：
 * 一天寫兩則，順著寫的順序讀才連得起來。拿標題去排只會得到一個跟你無關的順序。
 *
 * 本來這一段是靠 sort 穩定性加上查詢的 asc(createdAt) 湊出來的，
 * 改查詢就會安靜地翻掉，所以寫明。
 *
 * createdAt 用 ?? 墊過：本機快取可能是加這一欄之前存的。書籍與文章在
 * record-order.ts 修過同一件事，這支當時漏了。
 */
function sortWriting(writings: Writing[]): Writing[] {
  return [...writings].sort(
    (a, b) =>
      (b.date ?? "").localeCompare(a.date ?? "") ||
      (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
  );
}

export function useWritings() {
  const { records, ...rest } = useCollection<Writing>("writings", sortWriting);
  return { writings: records, ...rest };
}

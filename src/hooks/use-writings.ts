"use client";

import { useCollection } from "@/hooks/use-collection";
import { Writing } from "@/types/writing";

/**
 * 由新到舊；沒填日期的排最後。
 *
 * 同一天的維持原本的列序（sort 是穩定的），也就是你當初寫下的先後——
 * 拿標題去排只會得到一個跟你無關的順序。
 */
function sortWriting(writings: Writing[]): Writing[] {
  return [...writings].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function useWritings() {
  const { records, ...rest } = useCollection<Writing>("writings", sortWriting);
  return { writings: records, ...rest };
}

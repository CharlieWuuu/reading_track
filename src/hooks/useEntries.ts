"use client";

import { useSheetRecords } from "@/hooks/useSheetRecords";
import { Entry } from "@/types/entry";

/**
 * 由新到舊；沒填日期的排最後。
 *
 * 同一天的維持 Sheet 上的列序（sort 是穩定的），也就是你當初寫下的先後——
 * 拿標題去排只會得到一個跟你無關的順序。
 */
function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function useEntries() {
  const { records, ...rest } = useSheetRecords<Entry>("entries", sortEntries);
  return { entries: records, ...rest };
}

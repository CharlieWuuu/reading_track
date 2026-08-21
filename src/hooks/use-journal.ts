"use client";

import { useSheetRecords } from "@/hooks/use-sheet-records";
import { JournalEntry } from "@/types/journal";

/**
 * 由新到舊；沒填日期的排最後。
 *
 * 同一天的維持 Sheet 上的列序（sort 是穩定的），也就是你當初寫下的先後——
 * 拿標題去排只會得到一個跟你無關的順序。
 */
function sortJournal(journal: JournalEntry[]): JournalEntry[] {
  return [...journal].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function useJournal() {
  const { records, ...rest } = useSheetRecords<JournalEntry>("journal", sortJournal);
  return { journal: records, ...rest };
}

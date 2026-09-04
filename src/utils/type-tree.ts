import { splitTags } from "@/types/book";

/** 一筆紀錄身上的領域與次領域，書與文章都是這個形狀 */
export interface TypePathRow {
  domain: string;
  subDomain: string;
}

/**
 * 從紀錄配對出「領域 → 它底下用過的次領域」。
 *
 * 資料庫的 book_types 本來就有父子關係，但那份樹是靠寫入時 upsert 長出來的，
 * 也就是說每一組父子都在紀錄上出現過——直接從紀錄推，就不用多開一條資料流。
 * 只推得出兩層，樹再深要改成讀 book_types。
 */
export function childrenByDomain(rows: TypePathRow[]): Map<string, string[]> {
  const seen = new Map<string, Set<string>>();

  for (const row of rows) {
    // 領域雖然是單選，舊資料仍可能是頓號串起來的；那種情況每個領域都算掛過
    for (const domain of splitTags(row.domain)) {
      const children = seen.get(domain) ?? new Set<string>();
      for (const child of splitTags(row.subDomain)) children.add(child);
      seen.set(domain, children);
    }
  }

  return new Map(
    [...seen].map(([domain, children]) => [
      domain,
      [...children].sort((a, b) => a.localeCompare(b, "zh-Hant")),
    ]),
  );
}

/**
 * 選單要列的次領域。父領域沒選就列全部；選了就只列它底下的。
 *
 * 目前已選的值一律留著——舊資料裡有跨領域的組合，過濾掉會讓它在選單上消失，
 * 看起來像被清空了。
 */
export function scopedOptions(
  options: string[],
  children: string[] | undefined,
  current: string,
): string[] {
  if (!children?.length) return options;

  const kept = new Set(children);
  if (current.trim()) kept.add(current.trim());
  return options.filter((option) => kept.has(option));
}

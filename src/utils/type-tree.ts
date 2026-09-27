import { splitTags } from "@/types/book";

/** 一筆紀錄身上的領域與次領域，書與文章都是這個形狀 */
export interface TypePathRow {
  domain: string;
  subDomain: string;
}

/**
 * 從紀錄配對出「領域 → 它底下用過的次領域」。
 *
 * 資料庫的 topics 本來就有父子關係，但那份樹是靠寫入時 upsert 長出來的，
 * 也就是說每一組父子都在紀錄上出現過——直接從紀錄推，就不用多開一條資料流。
 * 只推得出兩層，樹再深要改成讀 topics。
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

type TopicNode = { name: string; isPrivate: boolean; children: readonly TopicNode[] };

/** 領域樹（每個類型共用那張）攤成「領域 → 次領域」。標私人的不列：選單是打開就看得到的 */
export const childrenOfTree = (nodes: readonly TopicNode[]): Map<string, string[]> =>
  new Map(
    nodes
      .filter((node) => !node.isPrivate)
      .map((node) => [
        node.name,
        node.children.filter((child) => !child.isPrivate).map((child) => child.name),
      ]),
  );

/** 兩份對照併成一份，同一個領域的次領域取聯集 */
export const mergeChildren = (
  ...maps: ReadonlyMap<string, readonly string[]>[]
): Map<string, string[]> =>
  maps.reduce<Map<string, string[]>>((merged, map) => {
    for (const [domain, children] of map) {
      merged.set(domain, [...new Set([...(merged.get(domain) ?? []), ...children])]);
    }
    return merged;
  }, new Map<string, string[]>());

/**
 * 選單要列的次領域：只列選到的領域底下用過的。那個領域還沒有子項就是空的，要新的直接打字。
 *
 * 目前已選的值一律留著——舊資料裡有跨領域的組合，過濾掉會讓它在選單上消失，
 * 看起來像被清空了。領域沒選時呼叫端不會叫這支，直接列全部。
 */
export function scopedOptions(
  options: string[],
  children: string[] | undefined,
  current: string,
): string[] {
  const kept = new Set(children ?? []);
  if (current.trim()) kept.add(current.trim());
  return options.filter((option) => kept.has(option));
}

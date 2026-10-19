import { AutofillSlug, inputOf } from "@/config/autofill-sources";

export type AutofillQuery = { title?: string; url?: string; language?: string };

/** 手上有的資料餵得動的來源：書名來源要標題，網頁來源要網址 */
export const usableSources = (
  sources: readonly AutofillSlug[],
  query: AutofillQuery,
): AutofillSlug[] =>
  sources.filter((slug) => Boolean((inputOf(slug) === "url" ? query.url : query.title)?.trim()));

/** 一個來源都餵不動時，提示該先填哪一格；有得查就回 null */
export function missingInput(
  sources: readonly AutofillSlug[],
  query: AutofillQuery,
): "標題" | "外部連結" | null {
  if (usableSources(sources, query).length > 0) return null;
  return sources.some((slug) => inputOf(slug) === "title") ? "標題" : "外部連結";
}

/**
 * 來源查回來的欄位（已是欄位鍵）補進表單。
 *
 * 只補空欄位、只補這個類型勾了的——手動改過的比查回來的可信，
 * 沒勾的欄位表單上根本沒那一格。回傳補完的整份值與補了幾格。
 */
export function fillFields(
  current: Record<string, string>,
  found: Record<string, string | undefined>,
  allowed: ReadonlySet<string>,
): { values: Record<string, string>; filled: number } {
  const fillable = Object.entries(found).flatMap(([key, value]): [string, string][] =>
    value?.trim() && allowed.has(key) && !current[key]?.trim() ? [[key, value]] : [],
  );
  return {
    values: { ...current, ...Object.fromEntries(fillable) },
    filled: fillable.length,
  };
}

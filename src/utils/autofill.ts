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

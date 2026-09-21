/** 麵包屑一段最多幾個字，超過就截斷加刪節號 */
export const CRUMB_MAX = 6;

/** 超過 max 個字就切到 max 再接刪節號；沒超過原樣回傳 */
export function truncateChars(text: string, max: number): string {
  return [...text].length > max ? [...text].slice(0, max).join("") + "…" : text;
}

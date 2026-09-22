import { KindGroup } from "@/config/record-kinds";

/**
 * 清單上一筆長什麼樣。類型自己選，不再由 slug 決定——
 * 寫死 slug === "quotes" 的話，使用者新增的「語錄」就排不成佳句。
 *
 * 選項是封閉的：畫法要有對應的元件，使用者挑得到的就是我們畫得出來的。
 * 但不按 group 發配——紀錄也可能想要單行，一年兩百本的封面牆反而找不到東西。
 */

export const CARD_STYLES = [
  { key: "cover", label: "封面卡" },
  { key: "fragment", label: "片段卡" },
  { key: "quote", label: "佳句" },
  { key: "line", label: "單行" },
] as const satisfies readonly { key: string; label: string }[];

export type CardStyle = (typeof CARD_STYLES)[number]["key"];

const KEYS = new Set<string>(CARD_STYLES.map((style) => style.key));

/** 紀錄預設有封面，其餘是一則一張卡 */
export const defaultCardStyle = (group: KindGroup): CardStyle =>
  group === "records" ? "cover" : "fragment";

/** 資料庫的字串收斂成合法值。舊資料或手改過的值落回該 group 的預設 */
export const toCardStyle = (value: string, group: KindGroup): CardStyle =>
  KEYS.has(value) ? (value as CardStyle) : defaultCardStyle(group);

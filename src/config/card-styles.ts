import { KindGroup } from "@/config/record-kinds";

/**
 * 版面底下一筆長什麼樣。概覽與卡片牆都讀它——同一種卡片可以排成概覽，
 * 也可以排成卡片牆，兩件事正交。
 *
 * 本來寫死判斷 slug === "quotes" 才排成引文，使用者新增的「語錄」就排不成佳句。
 * 選項是封閉的：畫法要有對應的元件，挑得到的就是我們畫得出來的。
 */

export const CARD_STYLES = [
  { key: "cover", label: "封面卡" },
  { key: "fragment", label: "片段卡" },
  { key: "quote", label: "佳句" },
  { key: "line", label: "單行" },
  { key: "thread", label: "整則" }, // 一路往下讀：頭像、標題、整段內文不截斷
] as const satisfies readonly { key: string; label: string }[];

export type CardStyle = (typeof CARD_STYLES)[number]["key"];

const KEYS = new Set<string>(CARD_STYLES.map((style) => style.key));

/** 紀錄預設有封面，書寫整則往下讀，片段一則一張卡 */
const DEFAULTS: Record<KindGroup, CardStyle> = {
  records: "cover",
  writings: "thread",
  fragments: "fragment",
};

export const defaultCardStyle = (group: KindGroup): CardStyle => DEFAULTS[group];

/** 資料庫的字串收斂成合法值。認不得的落回該 group 的預設 */
export const toCardStyle = (value: string, group: KindGroup): CardStyle =>
  KEYS.has(value) ? (value as CardStyle) : defaultCardStyle(group);

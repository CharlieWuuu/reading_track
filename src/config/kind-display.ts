/**
 * 類型的顯示設定：卡片牆怎麼分段、要不要算重讀、讀完要不要編號。
 *
 * 本來寫死在書籍專屬頁，電影、Podcast、自訂類型都沒有。存在 setting_kinds，
 * 通用頁照讀，設定頁可以開關。
 */

export const CARD_GROUPINGS = [
  { key: "month", label: "照月" },
  { key: "year", label: "照年" },
] as const satisfies readonly { key: string; label: string }[];

export type CardGroupBy = (typeof CARD_GROUPINGS)[number]["key"];

export type KindDisplay = {
  cardGroupBy: CardGroupBy; // 卡片牆的分段粒度
  countRereads: boolean; // 頁首寫「133 次・128 本」
  numberDone: boolean; // 讀完的依序編號 #128
};

export const DEFAULT_DISPLAY: KindDisplay = {
  cardGroupBy: "month",
  countRereads: false,
  numberDone: false,
};

export const toCardGroupBy = (value: unknown): CardGroupBy =>
  CARD_GROUPINGS.some((g) => g.key === value) ? (value as CardGroupBy) : "month";

/** 客戶端送來的內容收斂成合法值，認不得的落回預設 */
export const toKindDisplay = (body: Record<string, unknown>): KindDisplay => ({
  cardGroupBy: toCardGroupBy(body.cardGroupBy),
  countRereads: body.countRereads === true,
  numberDone: body.numberDone === true,
});

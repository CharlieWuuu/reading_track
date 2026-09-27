/**
 * 類型的顯示設定：要不要算重讀、讀完要不要編號。
 *
 * 本來寫死在書籍專屬頁，電影、Podcast、自訂類型都沒有。存在 setting_kinds，
 * 通用頁照讀，設定頁可以開關。卡片牆一律照年分段，不給選。
 */

export type KindDisplay = {
  countRereads: boolean; // 概覽「總共」寫作品數，底下補「讀了幾次」
  numberDone: boolean; // 讀完的依序編號 #128
};

export const DEFAULT_DISPLAY: KindDisplay = {
  countRereads: false,
  numberDone: false,
};

/** 客戶端送來的內容收斂成合法值，認不得的落回預設 */
export const toKindDisplay = (body: Record<string, unknown>): KindDisplay => ({
  countRereads: body.countRereads === true,
  numberDone: body.numberDone === true,
});

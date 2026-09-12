import { makeViewStore } from "@/stores/make-view-store";

export type WritingView = "card" | "table";

/**
 * 預設卡片：跟其他概覽頁（佳句、單字、專欄）同一套視覺語言，一則一張卡。
 * 表格是要找某一則時才切過去。
 *
 * 網址說了算，沒指定時沿用上次的選擇——跟書籍、堆概覽同一套規則，不然同一顆
 * 選單在不同頁表現不同（那邊記得住，這邊重整就回預設）。
 */
const store = makeViewStore<WritingView>("archivum-writing-view", ["card", "table"], "card");

export const useWritingViewStore = store.useStore;
export const isWritingView = store.isMode;

export const WRITING_VIEWS = {
  /** 預設值不寫進網址，分享出去的連結才乾淨 */
  toParam: (view: WritingView): string | null => (view === "card" ? null : view),
};

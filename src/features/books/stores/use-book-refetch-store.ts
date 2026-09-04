import { create } from "zustand";

/**
 * 「重新抓取資料」的狀態。按鈕在頁首、狀態在表單裡，兩邊是兄弟不是父子。
 *
 * 表單掛載時把動作與進度登記進來，頁首的按鈕照著畫；沒登記就不畫按鈕，
 * 所以其他頁面的頁首不會多出一顆按不動的鍵。
 */
interface BookRefetchStore {
  running: boolean;
  note: string;
  /** 表單登記進來的動作；null 代表現在沒有表單 */
  run: (() => void) | null;
  register: (run: () => void) => void;
  setProgress: (progress: { running: boolean; note: string }) => void;
  reset: () => void;
}

const EMPTY = { running: false, note: "", run: null };

export const useBookRefetchStore = create<BookRefetchStore>((set) => ({
  ...EMPTY,
  register: (run) => set({ run }),
  setProgress: ({ running, note }) => set({ running, note }),
  reset: () => set(EMPTY),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 版面：整頁怎麼排。overview 報紙式概覽（頭條加按月排的清單）、card 卡片牆、
 * table 一欄一欄看細節、stats 這一種的統計（畫哪幾張圖由勾了哪些模組決定）。
 *
 * 一筆長什麼樣是另一件事，存在 kinds.card_style——概覽與卡片牆都讀它。
 * 兩者正交：同一種卡片可以排成概覽，也可以排成卡片牆。
 *
 * 統計原本是另一條路由（/stats/<slug>），現在是同一頁的一種看法——
 * 「這一種有什麼」跟「這一種長什麼樣」問的是同一批資料。
 */
export type BookViewMode = "overview" | "card" | "table" | "stats";

export const BOOK_VIEW_MODES: BookViewMode[] = ["overview", "card", "table", "stats"];

export function isBookViewMode(value: string | null): value is BookViewMode {
  return BOOK_VIEW_MODES.includes(value as BookViewMode);
}

interface BookViewStore {
  view: BookViewMode;
  setView: (view: BookViewMode) => void;
}

export const useBookViewStore = create<BookViewStore>()(
  persist(
    (set) => ({
      view: "overview",
      setView: (view) => set({ view }),
    }),
    {
      name: "reading-track-book-view",
      // 舊版存過已刪掉的 detail，留著會讓書單一開就是空白
      version: 1,
      migrate: (state) => {
        const saved = state as BookViewStore;
        return { ...saved, view: isBookViewMode(saved?.view) ? saved.view : "overview" };
      },
    },
  ),
);

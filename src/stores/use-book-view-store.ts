import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * overview：報紙式的概覽，一個頭條加上按月排的清單；table：一欄一欄看細節；
 * card：書封牆，一次看很多本書的封面。一本書的完整資料交給詳細頁。
 * stats：這一種的統計，畫哪幾張圖由勾了哪些模組決定。
 *
 * 統計原本是另一條路由（/stats/<slug>），現在是同一頁的一種看法——
 * 「這一種有什麼」跟「這一種長什麼樣」問的是同一批資料。
 */
export type BookViewMode = "overview" | "table" | "card" | "stats";

export const BOOK_VIEW_MODES: BookViewMode[] = ["overview", "table", "card", "stats"];

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

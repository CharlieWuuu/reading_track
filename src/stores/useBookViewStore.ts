import { create } from "zustand";
import { persist } from "zustand/middleware";

/** table：一欄一欄看細節；card：書封牆，一次看很多本書的封面。一本書的完整資料交給詳細頁 */
export type BookViewMode = "table" | "card";

export const BOOK_VIEW_MODES: BookViewMode[] = ["table", "card"];

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
      view: "table",
      setView: (view) => set({ view }),
    }),
    {
      name: "reading-track-book-view",
      // 舊版存過已刪掉的 detail，留著會讓書單一開就是空白
      version: 1,
      migrate: (state) => {
        const saved = state as BookViewStore;
        return { ...saved, view: isBookViewMode(saved?.view) ? saved.view : "table" };
      },
    },
  ),
);

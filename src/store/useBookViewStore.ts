import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * table：一欄一欄看細節；card：書封牆，一次看很多本書的封面；
 * detail：一本一張橫式卡片，所有欄位都攤開。
 */
export type BookViewMode = "table" | "card" | "detail";

export const BOOK_VIEW_MODES: BookViewMode[] = ["table", "card", "detail"];

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
    { name: "reading-track-book-view" },
  ),
);

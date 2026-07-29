import { create } from "zustand";
import { persist } from "zustand/middleware";

/** table：一欄一欄看細節；card：書封牆，一次看很多本書的封面 */
export type BookViewMode = "table" | "card";

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
    { name: "reading-track-book-view" }
  )
);

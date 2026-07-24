import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BookCategories, DEFAULT_CATEGORIES } from "@/types/book";

interface BookStore {
  categories: BookCategories;
  addCategoryOption: (key: keyof BookCategories, value: string) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,
      addCategoryOption: (key, value) =>
        set((state) => {
          if (!value || state.categories[key].includes(value)) return state;
          return {
            categories: {
              ...state.categories,
              [key]: [...state.categories[key], value],
            },
          };
        }),
    }),
    { name: "reading-track-books" }
  )
);

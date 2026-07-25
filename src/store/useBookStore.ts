import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BookCategories, DEFAULT_CATEGORIES } from "@/types/book";

interface BookStore {
  categories: BookCategories;
  addCategoryOption: (key: keyof BookCategories, value: string) => void;
  removeCategoryOption: (key: keyof BookCategories, value: string) => void;
  renameCategoryOption: (key: keyof BookCategories, from: string, to: string) => void;
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
      removeCategoryOption: (key, value) =>
        set((state) => ({
          categories: {
            ...state.categories,
            [key]: state.categories[key].filter((v) => v !== value),
          },
        })),
      renameCategoryOption: (key, from, to) =>
        set((state) => {
          if (!to || from === to) return state;
          if (state.categories[key].includes(to)) return state;
          return {
            categories: {
              ...state.categories,
              [key]: state.categories[key].map((v) => (v === from ? to : v)),
            },
          };
        }),
    }),
    { name: "reading-track-books" }
  )
);

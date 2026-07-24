import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Book, BookCategories, DEFAULT_CATEGORIES } from "@/types/book";

interface BookStore {
  books: Book[];
  categories: BookCategories;
  addBook: (book: Book) => void;
  updateBook: (id: string, patch: Partial<Book>) => void;
  removeBook: (id: string) => void;
  addCategoryOption: (key: keyof BookCategories, value: string) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      books: [],
      categories: DEFAULT_CATEGORIES,
      addBook: (book) =>
        set((state) => ({ books: [...state.books, book] })),
      updateBook: (id, patch) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBook: (id) =>
        set((state) => ({ books: state.books.filter((b) => b.id !== id) })),
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

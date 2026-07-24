import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SheetStore {
  sheetId: string;
  sheetName: string;
  setSheet: (id: string, name: string) => void;
}

export const useSheetStore = create<SheetStore>()(
  persist(
    (set) => ({
      sheetId: "",
      sheetName: "",
      setSheet: (id, name) => set({ sheetId: id, sheetName: name }),
    }),
    { name: "reading-track-sheet" }
  )
);

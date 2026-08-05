import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SheetStore {
  sheetId: string;
  sheetName: string;
  setSheet: (id: string, name: string) => void;
  /**
   * localStorage 還原完了沒。
   *
   * 還原是在第一次渲染之後才發生的，這中間 sheetId 是空字串——
   * 直接照它判斷的話，每次開啟都會先閃一下「請先連接 Google Sheet」，
   * 看起來就像資料沒有被快取。
   */
  hydrated: boolean;
}

export const useSheetStore = create<SheetStore>()(
  persist(
    (set) => ({
      sheetId: "",
      sheetName: "",
      setSheet: (id, name) => set({ sheetId: id, sheetName: name }),
      hydrated: false,
    }),
    {
      name: "reading-track-sheet",
      // hydrated 是這台裝置當下的狀態，不寫進 localStorage
      partialize: ({ sheetId, sheetName }) => ({ sheetId, sheetName }),
      onRehydrateStorage: () => () => {
        useSheetStore.setState({ hydrated: true });
      },
    }
  )
);

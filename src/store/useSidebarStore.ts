import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 側欄收合狀態（只影響桌機版，手機版走底部導覽列） */
interface SidebarStore {
  collapsed: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: "reading-track-sidebar" }
  )
);

"use client";

import { DebugOverlay, DebugProvider } from "react-component-overlay";
import { useBookViewStore } from "@/stores/use-book-view-store";
import { useSheetStore } from "@/stores/use-sheet-store";
import { useSidebarStore } from "@/stores/use-sidebar-store";

const GLOBAL_STATE = {
  sheet: useSheetStore,
  bookView: useBookViewStore,
  sidebar: useSidebarStore,
};

export default function DebugTools({ children }: { children: React.ReactNode }) {
  return (
    <DebugProvider globalState={GLOBAL_STATE}>
      {children}
      <DebugOverlay />
    </DebugProvider>
  );
}

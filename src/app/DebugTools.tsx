"use client";

import { DebugOverlay, DebugProvider } from "react-component-overlay";
import { useBookViewStore } from "@/stores/useBookViewStore";
import { useSheetStore } from "@/stores/useSheetStore";
import { useSidebarStore } from "@/stores/useSidebarStore";

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

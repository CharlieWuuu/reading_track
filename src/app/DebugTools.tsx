"use client";

import { DebugOverlay, DebugProvider } from "react-component-overlay";
import { useSheetStore } from "@/store/useSheetStore";
import { useBookViewStore } from "@/store/useBookViewStore";
import { useInstapaperStore } from "@/store/useInstapaperStore";
import { useSidebarStore } from "@/store/useSidebarStore";

const GLOBAL_STATE = {
  sheet: useSheetStore,
  bookView: useBookViewStore,
  instapaper: useInstapaperStore,
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

"use client";

import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { SectionList } from "@/features/stats/components/section-list";
import { useWritingSections } from "@/features/stats/hooks/use-writing-sections";
import { useMounted } from "@/hooks/use-mounted";
import { useWritings } from "@/hooks/use-writings";
import { useSheetStore } from "@/stores/use-sheet-store";

export function WritingStats() {
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { writings, isLoading, error } = useWritings();

  const sections = useWritingSections(writings);

  if (!mounted) return null;
  if (!sheetId) return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  if (isLoading) return <PageLoading />;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (writings.length === 0) return <PageMessage>還沒有任何紀事</PageMessage>;

  return <SectionList sections={sections} />;
}

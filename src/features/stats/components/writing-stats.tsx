"use client";

import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useWritingSections } from "@/features/stats/hooks/use-writing-sections";
import { useWritings } from "@/hooks/use-writings";

export function WritingStats() {
  const { writings, isLoading, error } = useWritings();
  const sections = useWritingSections(writings);

  return (
    <DataGate
      isLoading={isLoading}
      error={error}
      isEmpty={writings.length === 0}
      emptyText="還沒有任何紀事"
    >
      <SectionList sections={sections} />
    </DataGate>
  );
}

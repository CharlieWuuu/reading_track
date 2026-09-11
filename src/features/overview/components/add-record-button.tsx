"use client";

import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/controls";
import { KindGroup } from "@/config/record-kinds";
import { useIsMobile } from "@/hooks/use-is-mobile";

/**
 * 概覽頁上的新增，直接連到這一堆的新增類型頁。
 *
 * 手機不畫：那邊要新增走底部導覽那顆，頁首的寬度留給類型切換。
 */
export function AddRecordButton({ group }: { group: KindGroup }) {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  return (
    <ActionButton href={`/${group}/new-kind`} label="新增" text="新增">
      <Plus size={16} strokeWidth={2} aria-hidden />
    </ActionButton>
  );
}

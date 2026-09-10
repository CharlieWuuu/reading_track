"use client";

import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/controls";
import { KindGroup } from "@/config/record-kinds";

/** 概覽頁上的新增，直接連到這一堆的新增類型頁 */
export function AddRecordButton({ group }: { group: KindGroup }) {
  return (
    <ActionButton href={`/${group}/new-kind`} label="新增" text="新增">
      <Plus size={16} strokeWidth={2} aria-hidden />
    </ActionButton>
  );
}

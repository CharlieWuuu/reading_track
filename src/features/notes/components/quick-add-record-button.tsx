"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { QuickAddRecordForm } from "@/features/notes/components/quick-add-record-form";

const LABEL = { quotes: "新增佳句", vocabulary: "新增單字" } as const;

/** 頁首那顆加號：一句話撐不起一整頁表單，所以是彈窗不是換頁 */
export function QuickAddRecordButton({ kind }: { kind: "quotes" | "vocabulary" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} label={LABEL[kind]}>
        <Plus size={16} strokeWidth={2} aria-hidden />
      </ActionButton>

      {open && (
        <Dialog title={LABEL[kind]} onClose={() => setOpen(false)}>
          <QuickAddRecordForm kind={kind} />
        </Dialog>
      )}
    </>
  );
}

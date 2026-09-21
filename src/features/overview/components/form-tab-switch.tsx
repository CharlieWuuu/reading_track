"use client";

import { FileText, Tags } from "lucide-react";
import { SegmentedControl } from "@/components/ui/controls";
import { useFormTabStore } from "@/stores/use-form-tab-store";
import { FormTab } from "@/utils/record-form";

const ITEMS = [
  { key: "content" as const, label: "內容", Icon: () => <FileText size={16} strokeWidth={1.5} /> },
  { key: "attributes" as const, label: "屬性", Icon: () => <Tags size={16} strokeWidth={1.5} /> },
];

/** 內容／屬性的切換。桌機在右欄寫出字，手機在頁首只留圖示——那一列擠不下四個字 */
export function FormTabSwitch({
  value,
  onChange,
  iconOnly = false,
}: {
  value: FormTab;
  onChange: (next: FormTab) => void;
  iconOnly?: boolean;
}) {
  const items = iconOnly ? ITEMS : ITEMS.map(({ key, label }) => ({ key, label }));
  return <SegmentedControl items={items} value={value} onChange={onChange} size="sm" />;
}

/** 頁首那顆，手機才畫——桌機的切換在表單右欄 */
export function FormTabHeaderSwitch() {
  const { tab, setTab } = useFormTabStore();
  return (
    <div className="md:hidden">
      <FormTabSwitch value={tab} onChange={setTab} iconOnly />
    </div>
  );
}

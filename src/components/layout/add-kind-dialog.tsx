"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 新增一種類型。只問名字——欄位庫是共用的，標籤沒改就用預設的，
 * 之後想把「創作者」改叫「攝影師」再去改那一種的設定。
 */
export function AddKindDialog({
  group,
  groupLabel,
  onClose,
}: {
  group: KindGroup;
  groupLabel: string;
  onClose: () => void;
}) {
  const { addKind } = useKinds();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      await addKind(group, name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增類型失敗");
      setSaving(false); // 失敗時留在原地，讓人改完再送一次
    }
  }

  return (
    <Dialog title={`${groupLabel}／新增類型`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void save();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="名稱" value={name} onChange={setName} />
        <FormActions saving={saving} saveLabel="新增" onCancel={onClose} error={error} />
      </form>
    </Dialog>
  );
}

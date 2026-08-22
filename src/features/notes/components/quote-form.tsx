"use client";

import { useState } from "react";
import { FormActions } from "@/components/ui/form-actions";
import { QuoteRecord } from "@/utils/vocabulary-stats";

const styles = {
  form: "flex flex-col gap-3",
  field: "flex flex-col gap-1",
  label: "flex items-baseline gap-2 text-sm font-medium",
  source: "text-[11px] text-gray-400",
  input: "w-full rounded-control border px-3 py-1.5 text-sm",
  text: "min-h-40 w-full resize-none rounded-control border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded-control bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded-control border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  remove:
    "ml-auto rounded-control px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600",
  error: "text-xs text-red-600",
};

type QuoteFormProps = {
  record: QuoteRecord;
  onSave: (record: QuoteRecord, remove: boolean) => Promise<void>;
  /** 存完、刪完或按取消之後要去哪 */
  onDone: () => void;
};

/** 佳句存在各自的書裡，改的是那本書佳句欄的那一行 */
export function QuoteForm({ record, onSave, onDone }: QuoteFormProps) {
  const [form, setForm] = useState(record);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(remove: boolean) {
    setSaving(true);
    setError("");
    try {
      await onSave(form, remove);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
    <div className={styles.form}>
      <p className={styles.source}>{record.bookTitle}</p>

      <div className={styles.field}>
        <label className={styles.label}>佳句</label>
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          className={styles.text}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>心得</label>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className={styles.text}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>章節</label>
        <input
          value={form.chapter}
          onChange={(e) => setForm({ ...form, chapter: e.target.value })}
          className={styles.input}
        />
      </div>

      <FormActions
        onSave={() => submit(false)}
        saving={saving}
        onCancel={onDone}
        onDelete={() => submit(true)}
        deleteLabel="刪除這一則"
        confirmLabel="確定刪除這一則？"
        error={error}
      />
    </div>
  );
}

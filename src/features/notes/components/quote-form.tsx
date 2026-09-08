"use client";

import { useState } from "react";
import { FormActions } from "@/components/ui/form-actions";
import { QuoteRecord } from "@/utils/stats/vocabulary-stats";

const styles = {
  form: "flex flex-col gap-3",
  field: "flex flex-col gap-1",
  label: "flex items-baseline gap-2 text-label font-medium tracking-label text-ink-faint uppercase",
  source: "text-meta text-ink-faint",
  input: "w-full rounded-control border border-rule bg-transparent px-3 py-1.5 text-sm text-ink",
  text: "min-h-40 w-full resize-none rounded-control border border-rule bg-transparent px-3 py-1.5 font-serif text-sm text-ink",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded-control bg-control-bg text-control-ink px-4 py-2 text-sm font-medium hover:bg-control-bg-hover disabled:opacity-50",
  cancel:
    "rounded-control border border-control-border px-4 py-2 text-sm font-medium text-control-ink-secondary hover:bg-control-ghost-hover",
  remove:
    "ml-auto rounded-control px-3 py-2 text-sm text-ink-muted hover:bg-control-ghost-hover hover:text-danger",
  error: "text-meta text-danger",
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

"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { QuoteRecord } from "@/lib/quoteStats";

const styles = {
  form: "flex flex-col gap-3",
  field: "flex flex-col gap-1",
  label: "flex items-baseline gap-2 text-sm font-medium",
  source: "text-[11px] text-gray-400",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  text: "min-h-28 w-full resize-none rounded border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  remove: "ml-auto rounded px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600",
  error: "text-xs text-red-600",
};

type QuoteEditDialogProps = {
  record: QuoteRecord;
  onSave: (record: QuoteRecord, remove: boolean) => Promise<void>;
  onClose: () => void;
};

/** 佳句存在各自的書裡，改的是那本書佳句欄的那一行 */
export function QuoteEditDialog({ record, onSave, onClose }: QuoteEditDialogProps) {
  const [form, setForm] = useState(record);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(remove: boolean) {
    setSaving(true);
    setError("");
    try {
      await onSave(form, remove);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
    <Dialog title={record.bookTitle} showTitle={false} onClose={onClose}>
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

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={saving}
            className={styles.save}
          >
            {saving ? "儲存中…" : "儲存"}
          </button>
          <button type="button" onClick={onClose} className={styles.cancel}>
            取消
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={saving}
            className={styles.remove}
          >
            刪除
          </button>
        </div>
      </div>
    </Dialog>
  );
}

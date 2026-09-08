"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NoteRecord } from "@/utils/stats/vocabulary-stats";

const styles = {
  form: "flex flex-col gap-3",
  source: "text-meta text-ink-faint",
  text: "min-h-64 w-full resize-none rounded-control border border-rule bg-transparent px-3 py-2 font-serif text-sm text-ink leading-relaxed",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded-control bg-control-bg text-control-ink px-4 py-2 text-sm font-medium hover:bg-control-bg-hover disabled:opacity-50",
  cancel:
    "rounded-control border border-control-border px-4 py-2 text-sm font-medium text-control-ink-secondary hover:bg-control-ghost-hover",
  error: "text-meta text-danger",
};

type NoteEditDialogProps = {
  record: NoteRecord;
  onSave: (record: NoteRecord) => Promise<void>;
  onClose: () => void;
};

/** 心得一本一則，改的就是那本書的筆記欄 */
export function NoteEditDialog({ record, onSave, onClose }: NoteEditDialogProps) {
  const [note, setNote] = useState(record.note);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave({ ...record, note });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
    <Dialog title={record.bookTitle} onClose={onClose}>
      <div className={styles.form}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className={styles.text} />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={handleSave} disabled={saving} className={styles.save}>
            {saving ? "儲存中…" : "儲存"}
          </button>
          <button type="button" onClick={onClose} className={styles.cancel}>
            取消
          </button>
        </div>
      </div>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { KeywordInfo } from "@/types/keyword";

const styles = {
  form: "flex flex-col gap-3",
  field: "flex flex-col gap-1",
  label: "flex items-baseline gap-2 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  summary: "min-h-24 w-full resize-none rounded border px-3 py-1.5 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  error: "text-xs text-red-600",
};

const FIELDS = [
  { key: "name", label: "名稱", hint: "改名會連帶改寫所有提到它的書" },
  { key: "topics", label: "學科", hint: "多個以頓號分隔" },
  { key: "coordinates", label: "座標", hint: "緯度,經度，例如 35.0117,135.7683" },
  { key: "span", label: "起訖", hint: "例如 1809－1882；西元前寫成 -384" },
  { key: "wikiUrl", label: "維基連結", hint: "" },
] as const;

type KeywordEditDialogProps = {
  info: KeywordInfo;
  /** previousName 給改名用：書籍表靠名字指向主檔，改名要連帶改寫那些書 */
  onSave: (info: KeywordInfo, previousName: string) => Promise<void>;
  onClose: () => void;
};

/** 維基查回來的欄位都能手改；改完整列覆寫，不會被下次補齊蓋掉 */
export function KeywordEditDialog({ info, onSave, onClose }: KeywordEditDialogProps) {
  const [form, setForm] = useState<KeywordInfo>(info);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof KeywordInfo, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.name.trim()) {
      setError("名稱不能是空的");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, name: form.name.trim() }, info.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
    <Dialog title={info.name} onClose={onClose}>
      <div className={styles.form}>
        {FIELDS.map((field) => (
          <div key={field.key} className={styles.field}>
            <label className={styles.label}>
              {field.label}
              {field.hint && <span className={styles.hint}>{field.hint}</span>}
            </label>
            <input
              value={form[field.key]}
              onChange={(e) => set(field.key, e.target.value)}
              className={styles.input}
            />
          </div>
        ))}

        <div className={styles.field}>
          <label className={styles.label}>摘要</label>
          <textarea
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            className={styles.summary}
          />
        </div>

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

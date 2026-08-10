"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { KeywordInfo } from "@/types/keyword";

const styles = {
  form: "flex flex-col gap-3",
  row: "grid grid-cols-2 gap-3",
  field: "flex min-w-0 flex-col gap-1",
  label: "flex items-baseline gap-2 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  input: "w-full rounded border px-3 py-1.5 text-sm",
  summary: "min-h-24 w-full resize-none rounded border px-3 py-1.5 text-sm",
  actions: "flex flex-wrap items-center gap-2 pt-1",
  lookup:
    "rounded border px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50",
  note: "text-xs text-gray-400",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  error: "text-xs text-red-600",
  // 刪除靠最右邊，跟儲存隔開，不會順手按到
  danger: "ml-auto flex items-center gap-2 text-xs",
  remove: "text-red-600 hover:underline disabled:opacity-50",
  confirm:
    "rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50",
  cancelSmall: "rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-50",
};

/** 兩兩並排的欄位；連結自己一列，放在最後 */
const ROWS = [
  [
    { key: "name", label: "名稱", hint: "改名會連帶改寫所有提到它的書" },
    { key: "topics", label: "學科", hint: "多個以頓號分隔" },
  ],
  [
    { key: "coordinates", label: "座標", hint: "緯度,經度" },
    { key: "span", label: "起訖", hint: "例如 1809－1882" },
  ],
] as const;

type KeywordEditDialogProps = {
  info: KeywordInfo;
  /** previousName 給改名用：書籍表靠名字指向主檔，改名要連帶改寫那些書 */
  onSave: (info: KeywordInfo, previousName: string) => Promise<void>;
  /** 給了就能刪；刪掉主檔那一列，引用它的書也會拿掉這個關鍵字 */
  onDelete?: (name: string) => Promise<unknown>;
  onClose: () => void;
};

/** 維基查回來的欄位都能手改；改完整列覆寫，不會被下次補齊蓋掉 */
export function KeywordEditDialog({ info, onSave, onDelete, onClose }: KeywordEditDialogProps) {
  const [form, setForm] = useState<KeywordInfo>(info);
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (key: keyof KeywordInfo, value: string) => setForm((f) => ({ ...f, [key]: value }));

  /** 去維基查這個字，查到的填進欄位讓人過目；要不要留下還是按儲存才算 */
  async function handleLookup() {
    setLooking(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/keywords/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");

      const found = data.keyword as KeywordInfo;
      if (!found.wikiUrl && !found.summary) {
        setNote("維基沒有這個條目");
        return;
      }
      setForm((f) => ({ ...found, name: f.name }));
      setNote("已填入維基的資料，確認後按儲存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "查詢失敗");
    } finally {
      setLooking(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSaving(true);
    setError("");
    try {
      await onDelete(info.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      setSaving(false);
      setConfirmDelete(false);
    }
  }

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
        {ROWS.map((row, i) => (
          <div key={i} className={styles.row}>
            {row.map((field) => (
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

        <div className={styles.field}>
          <label className={styles.label}>連結</label>
          <input
            value={form.wikiUrl}
            onChange={(e) => set("wikiUrl", e.target.value)}
            className={styles.input}
          />
        </div>

        {note && <p className={styles.note}>{note}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={handleSave} disabled={saving} className={styles.save}>
            {saving ? "儲存中…" : "儲存"}
          </button>
          <button type="button" onClick={onClose} className={styles.cancel}>
            取消
          </button>
          <button
            type="button"
            onClick={handleLookup}
            disabled={looking || !form.name.trim()}
            className={styles.lookup}
          >
            {looking ? "查詢中…" : "查維基"}
          </button>

          {/* 刪除按一次先要求確認：這一刀會動到所有提到它的書 */}
          {onDelete &&
            (confirmDelete ? (
              <div className={styles.danger}>
                <span className="text-gray-500">確定刪除？提到它的書也會拿掉這個關鍵字</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className={styles.confirm}
                >
                  刪除
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={styles.cancelSmall}
                >
                  取消
                </button>
              </div>
            ) : (
              <div className={styles.danger}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className={styles.remove}
                >
                  刪除這個關鍵字
                </button>
              </div>
            ))}
        </div>
      </div>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { formatSpan, KeywordInfo, parseSpan } from "@/types/keyword";

const styles = {
  form: "flex flex-col gap-3",
  row: "grid grid-cols-2 gap-3",
  field: "flex min-w-0 flex-col gap-1",
  label: "flex items-center gap-1.5 text-sm font-medium",
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

/** 名稱與學科同一列，座標自己一列；學科要配建議清單，不走這個迴圈 */
const ROWS = [[{ key: "name", label: "名稱" }], [{ key: "coordinates", label: "座標" }]] as const;

/**
 * 學科的選項就是「已經用過的學科」，不另外維護一份清單。
 *
 * 跟類型、領域同一個做法：打字就能登一個新的，用得多的排前面。
 * 多個學科用頓號串在同一格，Sheet 那邊仍然是一欄。
 */
function usedTopics(infos: KeywordInfo[]): string[] {
  const counts = new Map<string, number>();
  for (const info of infos) {
    for (const topic of info.topics.split("、").map((t) => t.trim())) {
      if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
    .map(([topic]) => topic);
}

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
  const { infos } = useKeywordInfos();
  const topicOptions = usedTopics(infos);
  const [form, setForm] = useState<KeywordInfo>(info);
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (key: keyof KeywordInfo, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // 起訖在 Sheet 上是「1809－1882」一格，這裡拆成兩欄填，存回去再併起來
  const span = parseSpan(form.span);
  const spanFrom = span?.from == null ? "" : String(span.from);
  const spanTo = span?.to == null ? "" : String(span.to);
  const setSpan = (from: string, to: string) => set("span", formatSpan(from, to));

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
      // 學科是自己分的，維基查回來不該動它
      setForm((f) => ({ ...found, name: f.name, topics: f.topics }));
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
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>名稱</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              學科
              <span className={styles.hint}>多個用「、」隔開</span>
            </label>
            <input
              value={form.topics}
              onChange={(e) => set("topics", e.target.value)}
              list="keyword-topics"
              className={styles.input}
            />
            <datalist id="keyword-topics">
              {topicOptions.map((topic) => (
                <option key={topic} value={topic} />
              ))}
            </datalist>
          </div>
        </div>

        {ROWS.slice(1).map((row, i) => (
          <div key={i} className={styles.row}>
            {row.map((field) => (
              <div key={field.key} className={styles.field}>
                <label className={styles.label}>{field.label}</label>
                <input
                  value={form[field.key]}
                  onChange={(e) => set(field.key, e.target.value)}
                  className={styles.input}
                />
              </div>
            ))}
          </div>
        ))}

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>起（西元年）</label>
            <input
              type="number"
              inputMode="numeric"
              value={spanFrom}
              onChange={(e) => setSpan(e.target.value, spanTo)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>訖（西元年）</label>
            <input
              type="number"
              inputMode="numeric"
              value={spanTo}
              onChange={(e) => setSpan(spanFrom, e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

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

"use client";

import { useState } from "react";
import { FormActions } from "@/components/ui/FormActions";
import { OptionSelect } from "@/components/ui/OptionSelect";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { formatSpan, KeywordInfo, parseSpan } from "@/types/keyword";

const styles = {
  form: "flex min-h-0 flex-1 flex-col gap-3",
  row: "grid grid-cols-2 gap-3",
  field: "flex min-w-0 flex-col gap-1",
  label: "flex items-center gap-1.5 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  // py-2 跟 OptionSelect 的觸發鈕一樣高，名稱與領域並排才不會一高一矮
  input: "w-full rounded border px-3 py-2 text-sm",
  // 摘要是整頁最長的一欄，給它一個真的打得下去的高度
  summary: "min-h-64 w-full flex-1 resize-none rounded border px-3 py-2 text-sm",
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

/** 名稱與領域同一列，座標自己一列；領域要配建議清單，不走這個迴圈 */
const ROWS = [[{ key: "name", label: "名稱" }], [{ key: "coordinates", label: "座標" }]] as const;

/**
 * 領域的選項就是「已經用過的領域」，不另外維護一份清單。
 *
 * 跟類型、領域同一個做法：打字就能登一個新的，用得多的排前面。
 * 多個領域用頓號串在同一格，Sheet 那邊仍然是一欄。
 */
function usedTopics(infos: KeywordInfo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const info of infos) {
    for (const topic of info.topics.split("、").map((t) => t.trim())) {
      if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return new Map(
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant")),
  );
}

type KeywordFormProps = {
  info: KeywordInfo;
  /** previousName 給改名用：書籍表靠名字指向主檔，改名要連帶改寫那些書 */
  onSave: (info: KeywordInfo, previousName: string) => Promise<void>;
  /** 給了就能刪；刪掉主檔那一列，引用它的書也會拿掉這個關鍵字 */
  onDelete?: (name: string) => Promise<unknown>;
  /** 存完、刪完、或按取消之後要去哪：對話框是關掉，整頁是回上一頁 */
  onDone: () => void;
};

/**
 * 關鍵字的欄位。維基查回來的每一欄都能手改，改完整列覆寫，不會被下次補齊蓋掉。
 *
 * 不自己畫外框：它同時長在整頁的編輯頁與表單裡的對話框上，兩邊只差外面那一層。
 */
export function KeywordForm({ info, onSave, onDelete, onDone }: KeywordFormProps) {
  const { infos } = useKeywordInfos();
  const topicCounts = usedTopics(infos);
  const [form, setForm] = useState<KeywordInfo>(info);
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

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
      // 領域是自己分的，維基查回來不該動它
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
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      setSaving(false);
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
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  }

  return (
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
          <OptionSelect
            label="領域"
            options={[...topicCounts.keys()]}
            counts={topicCounts}
            value={form.topics}
            onChange={(v) => set("topics", v)}
            multiple
          />
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

      <FormActions
        onSave={handleSave}
        saving={saving}
        onCancel={onDone}
        onDelete={onDelete ? handleDelete : undefined}
        deleteLabel="刪除這個關鍵字"
        confirmLabel="確定刪除？提到它的書也會拿掉這個關鍵字"
        error={error}
        extra={
          <button
            type="button"
            onClick={handleLookup}
            disabled={looking || !form.name.trim()}
            className={styles.lookup}
          >
            {looking ? "查詢中…" : "查維基"}
          </button>
        }
      />
    </div>
  );
}

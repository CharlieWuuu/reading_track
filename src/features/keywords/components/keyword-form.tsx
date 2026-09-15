"use client";

import { useState } from "react";
import { FIELD_LABEL_TEXT } from "@/components/ui/field-label";
import { FormActions } from "@/components/ui/form-actions";
import { OptionSelect } from "@/components/ui/option-select";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { KeywordInfo } from "@/types/keyword";

const styles = {
  form: "flex min-h-0 flex-1 flex-col gap-3",
  row: "grid grid-cols-2 gap-3",
  field: "flex min-w-0 flex-col gap-1",
  label: `flex items-center gap-1.5 ${FIELD_LABEL_TEXT}`,
  hint: "text-meta font-normal text-ink-faint",
  // py-2 跟 OptionSelect 的觸發鈕一樣高，名稱與領域並排才不會一高一矮
  input: "w-full rounded-control border border-rule bg-transparent px-3 py-2 text-sm text-ink",
  // 摘要是整頁最長的一欄，給它一個真的打得下去的高度
  summary:
    "min-h-64 w-full flex-1 resize-none rounded-control border border-rule bg-transparent px-3 py-2 font-serif text-sm text-ink",
  actions: "flex flex-wrap items-center gap-2 pt-1",
  save: "rounded-control bg-control-bg text-control-ink px-4 py-2 text-sm font-medium hover:bg-control-bg-hover disabled:opacity-50",
  cancel:
    "rounded-control border border-control-border px-4 py-2 text-sm font-medium text-control-ink-secondary hover:bg-control-ghost-hover",
  error: "text-meta text-danger",
  // 刪除靠最右邊，跟儲存隔開，不會順手按到
  danger: "ml-auto flex items-center gap-2 text-xs",
  remove: "text-danger hover:underline disabled:opacity-50",
  confirm:
    "rounded-control bg-danger px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-50",
  cancelSmall:
    "rounded-control border border-control-border px-3 py-1.5 text-control-ink-secondary hover:bg-control-ghost-hover",
};

/**
 * 領域的選項就是「已經用過的領域」，不另外維護一份清單。
 *
 * 跟類型、領域同一個做法：打字就能登一個新的，用得多的排前面。
 * 多個領域用頓號串在同一格，存回去仍然是一欄。
 */
function usedTags(infos: KeywordInfo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const info of infos) {
    for (const tag of info.tags.split("、").map((t) => t.trim())) {
      if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
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
 * 關鍵字的欄位。都是手填的——自動查維基那套拿掉了。
 *
 * 不自己畫外框：它同時長在整頁的編輯頁與表單裡的對話框上，兩邊只差外面那一層。
 */
export function KeywordForm({ info, onSave, onDelete, onDone }: KeywordFormProps) {
  const { infos } = useKeywordInfos();
  const tagCounts = usedTags(infos);
  const [form, setForm] = useState<KeywordInfo>(info);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof KeywordInfo, value: string) => setForm((f) => ({ ...f, [key]: value }));

  /** 數字欄：空白存 null，不存 0——沒填跟填 0 是兩回事 */
  const setNumber = (key: keyof KeywordInfo, value: string) =>
    setForm((f) => ({ ...f, [key]: value.trim() === "" ? null : Number(value) }));

  const show = (value: number | null) => (value === null ? "" : String(value));

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
            label="標籤"
            options={[...tagCounts.keys()]}
            counts={tagCounts}
            value={form.tags}
            onChange={(v) => set("tags", v)}
            multiple
          />
        </div>
      </div>

      {/* 經緯度各自一格。以前是一格打 "25.033,121.565"，少打逗號就整個失效，
          而且沒有任何提示 */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>緯度</label>
          <input
            type="number"
            inputMode="decimal"
            value={show(form.latitude)}
            onChange={(e) => setNumber("latitude", e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>經度</label>
          <input
            type="number"
            inputMode="decimal"
            value={show(form.longitude)}
            onChange={(e) => setNumber("longitude", e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>起（西元年）</label>
          <input
            type="number"
            inputMode="numeric"
            value={show(form.startYear)}
            onChange={(e) => setNumber("startYear", e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>訖（西元年）</label>
          <input
            type="number"
            inputMode="numeric"
            value={show(form.endYear)}
            onChange={(e) => setNumber("endYear", e.target.value)}
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

      <FormActions
        onSave={handleSave}
        saving={saving}
        onCancel={onDone}
        onDelete={onDelete ? handleDelete : undefined}
        deleteLabel="刪除這個關鍵字"
        confirmLabel="確定刪除？提到它的書也會拿掉這個關鍵字"
        error={error}
      />
    </div>
  );
}

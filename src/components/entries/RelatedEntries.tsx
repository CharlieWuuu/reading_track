"use client";

import Link from "next/link";
import { useState } from "react";
import { PenLine } from "lucide-react";
import { useEntries } from "@/lib/useEntries";
import { useSheetStore } from "@/store/useSheetStore";
import { Entry } from "@/types/entry";

const styles = {
  wrap: "flex min-h-0 flex-col gap-1",
  label: "flex shrink-0 items-center gap-1.5 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  list: "flex min-h-0 flex-1 flex-col divide-y overflow-y-auto rounded border",
  row: "flex flex-col gap-0.5 px-3 py-2 hover:bg-gray-50",
  title: "truncate text-sm",
  meta: "truncate text-xs text-gray-400",
  empty: "px-3 py-2 text-xs text-gray-400",
  draft: "min-h-20 w-full shrink-0 resize-none rounded border px-3 py-2 text-sm",
  actions: "flex shrink-0 items-center gap-2",
  save: "rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  more: "rounded border px-3 py-1.5 text-sm font-medium hover:bg-gray-50",
  error: "shrink-0 text-xs text-red-600",
};

/** 本地時區的今天；用 toISOString 會在台灣的早上八點前拿到昨天 */
function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * 這本書／這篇文章底下的書寫。
 *
 * 心得記在書寫那邊而不是這一列上，一本書就可以有很多則——讀前三章寫一則、
 * 讀完再寫一則，是兩個想法而不是同一則的編輯。
 *
 * 框裡寫的每一次都存成新的一則，所以它自己沒有狀態：要改舊的就點上面那一筆
 * 進去改，不會出現「我在編輯哪一則」這種要猜的事。
 */
export function RelatedEntries({
  sourceId,
  sourceTitle,
}: {
  sourceId: string;
  sourceTitle: string;
}) {
  const { entries, mutate } = useEntries();
  const { sheetId } = useSheetStore();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mine = entries.filter((e) => e.sourceId && e.sourceId === sourceId);

  const query = new URLSearchParams({ sourceId, sourceTitle, kind: "心得" });

  async function handleSave() {
    const note = draft.trim();
    if (!note) return;
    if (!sheetId) {
      setError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    // 標題預設就是書名／文章標題，想取別的名字再進書寫頁改
    const entry: Entry = {
      id: crypto.randomUUID(),
      date: today(),
      title: sourceTitle,
      kind: "心得",
      keywords: "",
      note,
      link: "",
      sourceTitle,
      sourceId,
      // 從書頁順手寫的一則預設公開；要藏就進書寫頁勾私人
      private: "",
    };

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, entry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setDraft("");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.label}>
        <PenLine size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
        書寫
        <span className={styles.hint}>心得寫在這裡，一本書可以有很多則</span>
      </label>

      <div className={styles.list}>
        {mine.length === 0 ? (
          <p className={styles.empty}>還沒有寫過</p>
        ) : (
          mine.map((e) => (
            <Link key={e.id} href={`/entries/${e.id}/edit`} className={styles.row}>
              <span className={styles.title}>{e.title}</span>
              <span className={styles.meta}>
                {[e.date, e.kind].filter(Boolean).join(" · ")}
                {e.note && ` · ${e.note.split(/\r?\n/)[0]}`}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* 寫完直接存成新的一則，不用先跳去書寫頁；這個框存完就清空 */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="寫一則心得，存起來會是新的一則"
        className={styles.draft}
      />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className={styles.save}
        >
          {saving ? "儲存中…" : "存成一則書寫"}
        </button>
        {/* 想順手填日期、類型、關鍵字就走這條；草稿帶過去不會白打 */}
        <Link
          href={`/entries/new?${new URLSearchParams({ ...Object.fromEntries(query), note: draft })}`}
          className={styles.more}
        >
          填其他欄位
        </Link>
      </div>
    </div>
  );
}

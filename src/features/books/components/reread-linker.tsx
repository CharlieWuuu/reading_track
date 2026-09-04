"use client";

import { useState } from "react";
import { useBooks } from "@/hooks/use-books";
import { Book } from "@/types/book";
import {
  findRereadGroups,
  RereadGroup,
  SIGNAL_LABEL,
  toOriginPatches,
} from "@/utils/reread-candidates";

const styles = {
  hint: "mb-3 text-xs text-gray-500",
  empty: "rounded-control border border-dashed p-3 text-xs text-gray-500",
  list: "flex flex-col gap-3",
  group: "rounded-control border p-3",
  head: "flex items-start gap-2",
  title: "min-w-0 flex-1 text-sm font-medium",
  signal: "shrink-0 rounded-control bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500",
  rows: "mt-2 flex flex-col gap-0.5 text-xs text-gray-500",
  origin: "text-gray-700",
  actions: "mt-4 flex items-center gap-3",
  submit:
    "rounded-control bg-control-bg text-control-ink px-4 py-2 text-sm font-medium hover:bg-control-bg-hover disabled:opacity-50",
  error: "text-xs text-red-600",
  done: "text-xs text-gray-500",
};

/** 一列在畫面上的樣子：日期是判斷「哪一次是第一次」的依據，所以一定要寫出來 */
function readLabel(book: Book): string {
  return [book.startDate || book.endDate || "沒有日期", book.author].filter(Boolean).join(" · ");
}

/**
 * 補舊資料的「同一本書編號」。
 *
 * 08-23 以前的重讀沒有連結，所以那幾列在重讀排行上會各算一本、詳情頁的佳句
 * 也分開算（排行認的是 originId，見 book-stats）。這裡把看起來是同一本的列
 * 聚起來，**列出來給人按確認**——書名有錯字、或真的是不同版本的那種，
 * 本來就需要人看一眼。
 *
 * 一組一個勾：整批同意跟逐組同意的差別，在於錯的那一組要不要連累其他組。
 */
export function RereadLinker() {
  const { books, mutate } = useBooks();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linked, setLinked] = useState<number | null>(null);

  const groups = findRereadGroups(books);
  const chosen = groups.filter((group) => !skipped.has(group.origin.id));

  function toggle(group: RereadGroup) {
    setSkipped((current) => {
      const next = new Set(current);
      if (next.has(group.origin.id)) next.delete(group.origin.id);
      else next.add(group.origin.id);
      return next;
    });
  }

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      const patches = toOriginPatches(chosen);
      const links = Object.fromEntries(
        [...patches].map(([id, patch]) => [id, patch.originId ?? ""]),
      );
      const res = await fetch("/api/books/link-rereads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "寫入失敗");
      setLinked(data.linked);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "寫入失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">補「同一本書編號」</h3>
      <p className={styles.hint}>
        把看起來是同一本、但還沒連起來的幾列指回第一次讀的那一列。連起來之後，
        重讀排行與詳情頁的佳句才會算在同一本書上。不確定的那組取消勾選就好。
      </p>

      {groups.length === 0 ? (
        <p className={styles.empty}>
          {linked === null ? "沒有找到看起來重複的列。" : `連好了 ${linked} 列。`}
        </p>
      ) : (
        <>
          <div className={styles.list}>
            {groups.map((group) => (
              <label key={group.origin.id} className={styles.group}>
                <span className={styles.head}>
                  <input
                    type="checkbox"
                    checked={!skipped.has(group.origin.id)}
                    onChange={() => toggle(group)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className={styles.title}>{group.origin.title}</span>
                  <span className={styles.signal}>{SIGNAL_LABEL[group.signal]}</span>
                </span>
                <span className={styles.rows}>
                  <span className={styles.origin}>第一次：{readLabel(group.origin)}</span>
                  {group.others.map((book) => (
                    <span key={book.id}>重讀：{readLabel(book)}</span>
                  ))}
                </span>
              </label>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || chosen.length === 0}
              className={styles.submit}
            >
              {busy ? "寫入中…" : `連結 ${chosen.length} 組`}
            </button>
            {error && <span className={styles.error}>{error}</span>}
            {linked !== null && !error && <span className={styles.done}>連好了 {linked} 列</span>}
          </div>
        </>
      )}
    </div>
  );
}

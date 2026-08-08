"use client";

import { useState } from "react";
import { useBooks } from "@/lib/useBooks";
import { useRecords } from "@/lib/useRecords";
import { useSheetStore } from "@/store/useSheetStore";

const styles = {
  button:
    "rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
  note: "mt-2 text-xs text-gray-500",
  error: "mt-2 text-xs text-red-600",
};

type Moved = { books: number; vocabulary: number; quotes: number };

/** 把書籍表舊的「單字」「佳句」儲存格搬進各自的分頁。只搬不刪，重跑不會產生重複 */
export function MigrateNotesButton() {
  const { sheetId } = useSheetStore();
  const { mutate: mutateRecords } = useRecords();
  const { mutate: mutateBooks } = useBooks();
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function run() {
    if (!sheetId) return;
    setRunning(true);
    setNote("");
    setError("");
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "搬移失敗");

      const moved = data as Moved;
      setNote(
        moved.books === 0
          ? "沒有需要搬的資料"
          : `搬了 ${moved.books} 本書：單字 ${moved.vocabulary} 筆、佳句 ${moved.quotes} 筆`,
      );
      await Promise.all([mutateRecords(), mutateBooks()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "搬移失敗");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={run} disabled={running || !sheetId} className={styles.button}>
        {running ? "搬移中…" : "搬移單字與佳句"}
      </button>
      {note && <p className={styles.note}>{note}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

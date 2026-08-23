"use client";

import { useEffect, useState } from "react";
import { importNotes, previewImportNotes } from "@/features/settings/api/import-notes";
import { useWritings } from "@/hooks/use-writings";
import { useSheetStore } from "@/stores/use-sheet-store";

const styles = {
  wrap: "flex flex-col gap-2",
  hint: "text-xs text-gray-500",
  button:
    "self-start rounded-control bg-control-bg text-control-ink px-4 py-2 text-sm font-medium hover:bg-control-bg-hover disabled:opacity-50",
  message: "text-xs text-gray-600",
  error: "text-xs text-red-600",
  list: "max-h-32 overflow-y-auto rounded-control border bg-gray-50 px-3 py-2 text-xs text-gray-500",
};

/**
 * 把書籍與文章的心得搬成一則則紀事。
 *
 * 原本那一欄不會被清掉——搬錯了才有得回頭。已經搬過的靠「延伸自編號」認出來，
 * 按第二次不會重複搬。
 */
export function ImportNotesButton() {
  const { sheetId } = useSheetStore();
  const { mutate } = useWritings();
  const [pending, setPending] = useState<{ count: number; titles: string[] } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  // 先看會搬幾筆再決定要不要按，不要按下去才知道
  useEffect(() => {
    if (!sheetId) return;
    let cancelled = false;
    previewImportNotes(sheetId)
      .then((preview) => {
        if (cancelled || !preview) return;
        setPending({ count: preview.pending, titles: preview.titles });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [sheetId, status]);

  if (!sheetId) return null;

  async function handleClick() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await importNotes(sheetId);

      await mutate();
      setStatus("done");
      setMessage(`已搬移 ${data.migrated} 則`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "搬移失敗");
    }
  }

  const count = pending?.count ?? 0;

  return (
    <div className={styles.wrap}>
      <h3 className="text-sm font-medium">把心得搬成書寫</h3>
      <p className={styles.hint}>
        書籍與文章的「心得」欄各變成一則書寫，類型照來源標「書籍」「文章」、延伸自指回原本那一筆。
        原本的欄位不會被清掉，確認搬得沒問題之後你再自己刪。
      </p>

      {count > 0 && <div className={styles.list}>{pending?.titles.join("、")}</div>}

      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading" || count === 0}
        className={styles.button}
      >
        {status === "loading" ? "搬移中…" : count > 0 ? `搬移 ${count} 則` : "沒有可搬的心得"}
      </button>

      {message && <p className={status === "error" ? styles.error : styles.message}>{message}</p>}
    </div>
  );
}

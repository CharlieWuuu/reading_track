"use client";

import { useState } from "react";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";

export function EnrichButton() {
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [failures, setFailures] = useState<string[]>([]);

  if (!sheetId) return null;

  async function handleClick() {
    setStatus("loading");
    setMessage("");
    setFailures([]);
    try {
      const res = await fetch("/api/books/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const progress =
          typeof data.updated === "number" ? `（已補齊 ${data.updated} 筆後中斷）` : "";
        throw new Error(`${data.error ?? "補齊失敗"}${progress}`);
      }
      const parts = [`已補齊 ${data.updated} 筆（掃描 ${data.scanned} 筆）`];
      if (data.idsBackfilled > 0) parts.push(`補上 ${data.idsBackfilled} 個編號`);
      if (data.skipped > 0) parts.push(`${data.skipped} 筆查不到資料`);
      if (data.remaining > 0) parts.push(`還有 ${data.remaining} 筆，再按一次可繼續`);
      setMessage(parts.join("，"));
      setFailures(data.failures ?? []);
      setStatus("done");
      mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "補齊失敗");
      setFailures([]);
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-xs ${status === "error" ? "text-red-600" : "text-gray-500"}`}>
          {message}
          {failures.length > 0 && (
            <span className="block text-gray-400">查不到：{failures.join("、")}</span>
          )}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
      >
        {status === "loading" ? "補齊中…" : "自動補齊資料"}
      </button>
    </div>
  );
}

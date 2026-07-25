"use client";

import { useState } from "react";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";

export function EnrichButton() {
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!sheetId) return null;

  async function handleClick() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/books/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "補齊失敗");
      setMessage(`已補齊 ${data.updated} 筆（掃描 ${data.scanned} 筆，${data.skipped} 筆找不到資料）`);
      setStatus("done");
      mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "補齊失敗");
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-xs ${status === "error" ? "text-red-600" : "text-gray-500"}`}>
          {message}
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

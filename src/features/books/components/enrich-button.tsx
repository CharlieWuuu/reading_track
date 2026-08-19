"use client";

import { useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import { useSheetStore } from "@/store/useSheetStore";

export function EnrichButton() {
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  // 上次掃到哪一本，下次從那之後接著跑，避免每次都被同一批查不到的書卡住
  const [after, setAfter] = useState<string | null>(null);

  if (!sheetId) return null;

  async function handleClick() {
    setStatus("loading");
    setMessage("");
    setDetails([]);
    try {
      const res = await fetch("/api/books/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, after }),
      });
      const data = await res.json();
      if (!res.ok) {
        const progress =
          typeof data.updated === "number" ? `（已補齊 ${data.updated} 筆後中斷）` : "";
        throw new Error(`${data.error ?? "補齊失敗"}${progress}`);
      }
      const parts = [`已補齊 ${data.updated} 筆（掃描 ${data.scanned} 筆）`];
      if (data.idsBackfilled > 0) parts.push(`補上 ${data.idsBackfilled} 個編號`);
      if (data.notFound > 0) parts.push(`${data.notFound} 筆查不到這本書`);
      if (data.noNewData > 0) parts.push(`${data.noNewData} 筆已無可補欄位`);
      if (data.remaining > 0) parts.push(`還有 ${data.remaining} 筆，再按一次可繼續`);
      setAfter(data.nextAfter ?? null);
      setMessage(parts.join("，"));

      // 分開列出來：「查不到書」要自己填，「已無可補欄位」只是剩下的欄位沒人給，
      // 資料其實已經補過了，不需要再管它
      const lines: string[] = [];
      if (data.sourceIssues?.length) {
        lines.push(`來源異常（結果可能不準，稍後再試）：${data.sourceIssues.join("、")}`);
      }
      if (data.notFoundTitles?.length) {
        lines.push(`查不到：${data.notFoundTitles.join("、")}`);
      }
      if (data.noNewDataTitles?.length) {
        lines.push(`已無可補欄位（多半是缺書封或頁數）：${data.noNewDataTitles.join("、")}`);
      }
      setDetails(lines);
      setStatus("done");
      mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "補齊失敗");
      setDetails([]);
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-xs ${status === "error" ? "text-red-600" : "text-gray-500"}`}>
          {message}
          {details.map((line) => (
            <span key={line} className="block text-gray-400">
              {line}
            </span>
          ))}
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

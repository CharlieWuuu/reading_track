"use client";

import { useState } from "react";
import { Book } from "@/types/book";

export interface LookupResult {
  /** 查到的欄位，直接拿去帶入編輯表單 */
  prefill: Partial<Book>;
  /** 查不到時給使用者看的說明；有查到就是空字串 */
  notice: string;
}

/**
 * 新增書籍的第一步：先查資料，查到了再進編輯頁。
 *
 * 查不到也可以直接進下一步自己填——不讓使用者卡在這裡，
 * 但要讓他知道待會兒得自己動手。
 */
export function BookLookupStep({ onDone }: { onDone: (result: LookupResult) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = Boolean(title.trim() || url.trim());

  async function lookupByUrl(): Promise<Partial<Book> | null> {
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.title ? { ...data, sourceUrl: url.trim() } : { sourceUrl: url.trim() };
  }

  async function lookupByTitle(): Promise<Partial<Book> | null> {
    const res = await fetch(`/api/search-book?q=${encodeURIComponent(title.trim())}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");
    try {
      // 網址是明確指向某一本書的，比書名搜尋可靠，所以優先用
      const fromUrl = url.trim() ? await lookupByUrl().catch(() => null) : null;
      const fromTitle = title.trim() ? await lookupByTitle().catch(() => null) : null;

      // 兩邊都查的話，以網址為主、書名的結果補空缺
      const merged: Partial<Book> = { ...(fromTitle ?? {}), ...clean(fromUrl ?? {}) };
      if (title.trim() && !merged.title) merged.title = title.trim();
      if (url.trim()) merged.sourceUrl = url.trim();

      const found = Boolean(merged.author || merged.publisher || merged.coverUrl);
      onDone({
        prefill: merged,
        notice: found ? "" : "查不到這本書的資料，可以直接進下一步自己填。",
      });
    } catch {
      setError("查詢失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500">
        先查書籍資料，查到之後再進編輯頁。書名和網址擇一填寫即可，兩個都填會以網址為準。
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium">書名</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：深度工作力"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">書籍網址</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="貼上讀墨 / Kindle / Pubu 等連結"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "查詢中…" : "查詢並繼續"}
        </button>
        <button
          type="button"
          onClick={() => onDone({ prefill: {}, notice: "" })}
          className="text-sm text-gray-500 hover:underline"
        >
          略過，直接手動輸入
        </button>
      </div>
    </form>
  );
}

/** 去掉空字串，才不會用空值蓋掉另一個來源查到的內容 */
function clean(source: Partial<Book>): Partial<Book> {
  return Object.fromEntries(
    Object.entries(source).filter(([, v]) => typeof v !== "string" || v.trim() !== "")
  ) as Partial<Book>;
}

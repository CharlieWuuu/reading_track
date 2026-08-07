"use client";

import { useState } from "react";
import { Book, formatCount } from "@/types/book";

export interface LookupResult {
  /** 查到的欄位，直接拿去帶入編輯表單 */
  prefill: Partial<Book>;
  /** 查不到時給使用者看的說明；有查到就是空字串 */
  notice: string;
}

/**
 * 新增書籍的第一步：先查資料，把查到什麼攤開給使用者看，他確認了才進編輯頁。
 *
 * 刻意分成「查詢」和「繼續」兩個動作。查詢結果不確定性高（書名搜尋常常撈不到、
 * 或撈到同名的另一本），如果按一下就跳頁，使用者是在賭下一頁會有東西。
 * 先看到結果再決定，查壞了可以改關鍵字重查，不用退回上一頁。
 */
export function BookLookupStep({ onDone }: { onDone: (result: LookupResult) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);

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

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      // 網址是明確指向某一本書的，比書名搜尋可靠，所以優先用
      const fromUrl = url.trim() ? await lookupByUrl().catch(() => null) : null;
      const fromTitle = title.trim() ? await lookupByTitle().catch(() => null) : null;

      // 兩邊都查的話，以網址為主、書名的結果補空缺
      const merged: Partial<Book> = { ...(fromTitle ?? {}), ...clean(fromUrl ?? {}) };
      if (title.trim() && !merged.title) merged.title = title.trim();
      if (url.trim()) merged.sourceUrl = url.trim();

      const found = Boolean(merged.author || merged.publisher || merged.coverUrl);
      setResult({
        prefill: merged,
        notice: found ? "" : "查不到這本書的資料，可以直接進下一步自己填。",
      });
    } catch {
      setError("查詢失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  const found = result !== null && result.notice === "";

  return (
    <form onSubmit={handleLookup} className="space-y-4 rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500">
        先查書籍資料，確認查到的內容之後再進編輯頁。書名和網址擇一填寫即可，兩個都填會以網址為準。
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium">書名</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setResult(null);
          }}
          placeholder="輸入書名"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">書籍網址</label>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setResult(null);
          }}
          placeholder="貼上電子書或書店連結"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {result && (found ? <FoundCard prefill={result.prefill} /> : <NotFoundCard />)}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            found
              ? "border border-gray-900 hover:bg-gray-100"
              : "bg-gray-900 text-white hover:bg-gray-700"
          }`}
        >
          {loading ? "查詢中…" : result ? "重新查詢" : "查詢"}
        </button>

        {/* 查到了才給主要按鈕，讓「繼續」變成確認動作而不是碰運氣 */}
        {result && (
          <button
            type="button"
            onClick={() => onDone(result)}
            className={`rounded px-4 py-2 text-sm font-medium ${
              found
                ? "bg-gray-900 text-white hover:bg-gray-700"
                : "border border-gray-900 hover:bg-gray-100"
            }`}
          >
            {found ? "使用這筆資料，繼續" : "仍要繼續，手動填寫"}
          </button>
        )}

        {!result && (
          <button
            type="button"
            onClick={() => onDone({ prefill: {}, notice: "" })}
            className="text-sm text-gray-500 hover:underline"
          >
            略過，直接手動輸入
          </button>
        )}
      </div>
    </form>
  );
}

function FoundCard({ prefill }: { prefill: Partial<Book> }) {
  return (
    <div className="flex gap-3 rounded border border-green-200 bg-green-50 p-3">
      {prefill.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prefill.coverUrl}
          alt=""
          loading="lazy"
          className="aspect-2/3 w-12 shrink-0 rounded-sm object-cover shadow-sm"
        />
      )}
      <div className="min-w-0 space-y-0.5 text-xs">
        <p className="text-sm font-medium wrap-break-word">{prefill.title}</p>
        {prefill.author && <p className="text-gray-600">作者：{prefill.author}</p>}
        {prefill.publisher && <p className="text-gray-600">出版社：{prefill.publisher}</p>}
        {prefill.pageCount && (
          <p className="text-gray-600">頁數：{formatCount(prefill.pageCount)}</p>
        )}
        <p className="pt-0.5 text-green-700">查到資料了，確認沒錯就可以繼續。</p>
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      查不到這本書的資料。可以換個關鍵字重查，或直接繼續自己填。
    </div>
  );
}

/** 去掉空字串，才不會用空值蓋掉另一個來源查到的內容 */
function clean(source: Partial<Book>): Partial<Book> {
  return Object.fromEntries(
    Object.entries(source).filter(([, v]) => typeof v !== "string" || v.trim() !== ""),
  ) as Partial<Book>;
}

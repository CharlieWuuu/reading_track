"use client";

import { useState } from "react";
import { BookCover } from "@/components/ui/book-cover";
import { scrapeBook, searchBookByTitle } from "@/features/books/api/lookup-book";
import { ReadBookSuggestions } from "@/features/books/components/read-book-suggestions";
import { useBooks } from "@/hooks/use-books";
import { Book, formatCount } from "@/types/book";
import { parseLookupQuery } from "@/utils/lookup-query";

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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const { books } = useBooks();

  /**
   * 重讀：直接帶上次那筆，只留下「這次才會不同的」四欄不帶。
   *
   * 狀態不用清——它是從日期推出來的（`types/book.ts` 的 `statusOf`），
   * 日期空著就自動回到「想讀」。
   */
  function pickReadBook(book: Book) {
    // 這四欄是「這一次」的事，其餘都是「這本書」的事
    const carried: Partial<Book> = {
      ...book,
      id: "",
      startDate: "",
      endDate: "",
      note: "",
      // 一律指回最初那一列：選到的如果本身也是重讀，就沿用它的源頭，不接成一條鏈
      originId: book.originId || book.id,
    };
    // 講清楚剛才發生了什麼：欄位突然全滿，沒說一聲會以為是查到的
    onDone({
      prefill: carried,
      notice: "已帶入上次讀這本書的資料。日期與心得留空，其餘照舊。",
    });
  }

  // 一個框收兩種輸入：貼連結就爬那一頁，打字就搜書名
  const lookup = parseLookupQuery(query);

  async function lookupByUrl(url: string): Promise<Partial<Book>> {
    const found = await scrapeBook(url).catch(() => null);
    // 沒查到也把網址記住：使用者已經貼了，不該讓他再貼一次
    return found ? { ...clean(found), sourceUrl: url } : { sourceUrl: url };
  }

  async function lookupByTitle(title: string): Promise<Partial<Book>> {
    const found = await searchBookByTitle(title).catch(() => null);
    return { ...clean(found ?? {}), title: found?.title || title };
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookup || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const merged =
        lookup.kind === "url" ? await lookupByUrl(lookup.url) : await lookupByTitle(lookup.title);

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
    <form onSubmit={handleLookup} className="rounded-surface space-y-4 border bg-white p-5">
      {/* 書名與網址同一個框：兩件事都是「這本書叫什麼」，分成兩格只是逼人先分類 */}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResult(null);
          }}
          placeholder="輸入書名，或貼上電子書、書店連結"
          className="rounded-control w-full border px-3 py-2 text-sm"
        />
        {/* 讀過的先跳出來：重讀不用重查，上次那筆就是最準的。貼網址時不用建議 */}
        {lookup?.kind !== "url" && (
          <ReadBookSuggestions books={books} query={query} onPick={pickReadBook} />
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {result && (found ? <FoundCard prefill={result.prefill} /> : <NotFoundCard />)}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!lookup || loading}
          className={`rounded-control px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            found
              ? "border-rule-strong border hover:bg-gray-100"
              : "bg-control-bg text-control-ink hover:bg-control-bg-hover"
          }`}
        >
          {loading ? "查詢中…" : result ? "重新查詢" : "查詢"}
        </button>

        {/* 查到了才給主要按鈕，讓「繼續」變成確認動作而不是碰運氣 */}
        {result && (
          <button
            type="button"
            onClick={() => onDone(result)}
            className={`rounded-control px-4 py-2 text-sm font-medium ${
              found
                ? "bg-control-bg text-control-ink hover:bg-control-bg-hover"
                : "border-rule-strong border hover:bg-gray-100"
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
    <div className="rounded-control flex gap-3 border border-green-200 bg-green-50 p-3">
      {prefill.coverUrl && (
        <BookCover url={prefill.coverUrl} title={prefill.title ?? ""} size="search" />
      )}
      <div className="min-w-0 space-y-0.5 text-xs">
        <p className="text-sm font-medium wrap-break-word">{prefill.title}</p>
        {prefill.author && <p className="text-gray-600">作者：{prefill.author}</p>}
        {prefill.publisher && <p className="text-gray-600">出版社：{prefill.publisher}</p>}
        {prefill.pageCount && (
          <p className="text-gray-600">頁數：{formatCount(prefill.pageCount)}</p>
        )}
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      查不到這本書的資料
    </div>
  );
}

/** 去掉空字串，才不會用空值蓋掉另一個來源查到的內容 */
function clean(source: Partial<Book>): Partial<Book> {
  return Object.fromEntries(
    Object.entries(source).filter(([, v]) => typeof v !== "string" || v.trim() !== ""),
  ) as Partial<Book>;
}

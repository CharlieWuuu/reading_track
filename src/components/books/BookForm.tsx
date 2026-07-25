"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { Book, BookPlatform } from "@/types/book";
import { BookSearchResult } from "@/app/api/search-book/route";

const PLATFORMS: BookPlatform[] = [
  "博客來",
  "讀墨",
  "Kobo",
  "Kindle",
  "Hyread",
  "Pubu",
  "實體書",
  "其他",
];

const emptyForm = {
  sourceUrl: "",
  title: "",
  author: "",
  isbn: "",
  coverUrl: "",
  publisher: "",
  platform: "其他" as BookPlatform,
  startDate: "",
  endDate: "",
  domain: "",
  type: "",
  language: "",
  note: "",
};

function bookToForm(book: Book): typeof emptyForm {
  return {
    sourceUrl: book.sourceUrl,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    publisher: book.publisher,
    platform: book.platform,
    startDate: book.startDate ?? "",
    endDate: book.endDate ?? "",
    domain: book.domain,
    type: book.type,
    language: book.language,
    note: book.note,
  };
}

export function BookForm({ book }: { book?: Book }) {
  const router = useRouter();
  const { categories, addCategoryOption } = useBookStore();
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();
  const [form, setForm] = useState(book ? bookToForm(book) : emptyForm);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isEdit = Boolean(book);

  function set<K extends keyof typeof emptyForm>(key: K, value: typeof emptyForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleScrape() {
    if (!form.sourceUrl.trim()) return;
    setScraping(true);
    setScrapeError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.sourceUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "爬蟲失敗");

      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        author: data.author || f.author,
        isbn: data.isbn || f.isbn,
        coverUrl: data.coverUrl || f.coverUrl,
        publisher: data.publisher || f.publisher,
        platform: data.platform || f.platform,
      }));
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "爬蟲失敗");
    } finally {
      setScraping(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const res = await fetch(`/api/search-book?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "搜尋失敗");
      setSearchResults(data.results ?? []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "搜尋失敗");
    } finally {
      setSearching(false);
    }
  }

  function applySearchResult(result: BookSearchResult) {
    setForm((f) => ({
      ...f,
      title: result.title || f.title,
      author: result.author || f.author,
      isbn: result.isbn || f.isbn,
      coverUrl: result.coverUrl || f.coverUrl,
      publisher: result.publisher || f.publisher,
    }));
    setSearchResults([]);
    setSearchQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!sheetId) {
      setSubmitError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    const payload = {
      title: form.title,
      author: form.author,
      isbn: form.isbn,
      coverUrl: form.coverUrl,
      publisher: form.publisher,
      platform: form.platform,
      sourceUrl: form.sourceUrl,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      domain: form.domain,
      type: form.type,
      language: form.language,
      note: form.note,
    };

    setSubmitting(true);
    setSubmitError("");
    try {
      if (isEdit && book) {
        const res = await fetch(`/api/books/${book.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newBook: Book = { id: crypto.randomUUID(), ...payload };
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, book: newBook }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
      }

      if (form.domain) addCategoryOption("domain", form.domain);
      if (form.type) addCategoryOption("type", form.type);
      if (form.language) addCategoryOption("language", form.language);

      await mutate();
      router.push("/books");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-5 space-y-4">
      {!isEdit && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">書籍 URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="貼上博客來 / 讀墨 / Kobo 等連結"
                value={form.sourceUrl}
                onChange={(e) => set("sourceUrl", e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleScrape}
                disabled={scraping || !form.sourceUrl.trim()}
                className="shrink-0 rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                {scraping ? "抓取中…" : "抓取資料"}
              </button>
            </div>
            {scrapeError ? (
              <p className="mt-1 text-xs text-red-600">{scrapeError}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                目前支援讀墨、Kindle、Pubu 自動抓取；博客來、Kobo、Hyread
                請用下方書名搜尋或手動輸入。
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">或用書名搜尋</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="輸入書名，例如：深度工作力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="shrink-0 rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                {searching ? "搜尋中…" : "搜尋"}
              </button>
            </div>
            {searchError && <p className="mt-1 text-xs text-red-600">{searchError}</p>}

            {searchResults.length > 0 && (
              <ul className="mt-2 divide-y rounded border">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => applySearchResult(r)}
                      className="flex w-full items-center gap-3 p-2 text-left text-sm hover:bg-gray-50"
                    >
                      {r.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverUrl} alt="" className="h-12 w-8 shrink-0 object-cover" />
                      ) : (
                        <div className="h-12 w-8 shrink-0 bg-gray-100" />
                      )}
                      <span>
                        <span className="block font-medium">{r.title}</span>
                        <span className="block text-xs text-gray-500">
                          {r.author}
                          {r.publisher ? ` · ${r.publisher}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="書名" value={form.title} onChange={(v) => set("title", v)} required />
        <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />
        <Field label="ISBN" value={form.isbn} onChange={(v) => set("isbn", v)} />
        <Field label="封面 URL" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />
        <Field label="出版社" value={form.publisher} onChange={(v) => set("publisher", v)} />

        <div>
          <label className="block text-sm font-medium mb-1">平台</label>
          <select
            value={form.platform}
            onChange={(e) => set("platform", e.target.value as BookPlatform)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <Field label="開始日期" type="date" value={form.startDate} onChange={(v) => set("startDate", v)} />
        <Field label="完成日期" type="date" value={form.endDate} onChange={(v) => set("endDate", v)} />

        <CategoryField
          label="領域"
          value={form.domain}
          options={categories.domain}
          onChange={(v) => set("domain", v)}
        />
        <CategoryField
          label="屬性"
          value={form.type}
          options={categories.type}
          onChange={(v) => set("type", v)}
        />
        <CategoryField
          label="語言"
          value={form.language}
          options={categories.language}
          onChange={(v) => set("language", v)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">筆記</label>
        <textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          rows={3}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {submitError && <p className="text-xs text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {submitting ? "儲存中…" : isEdit ? "儲存變更" : "新增書籍"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm"
      />
    </div>
  );
}

function CategoryField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        list={`${label}-options`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="選擇或輸入新分類"
      />
      <datalist id={`${label}-options`}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSheetStore } from "@/store/useSheetStore";
import { useBooks } from "@/lib/useBooks";
import { Book, BookPlatform, BOOK_PLATFORMS, READING_STATUSES, ReadingStatus } from "@/types/book";
import { CategorySelect } from "./CategorySelect";

const emptyForm = {
  sourceUrl: "",
  title: "",
  author: "",
  coverUrl: "",
  publisher: "",
  platform: "其他" as BookPlatform,
  status: "想讀" as ReadingStatus,
  startDate: "",
  endDate: "",
  domain: "",
  type: "",
  language: "",
  pageCount: "",
  wordCount: "",
  note: "",
};

type FormState = typeof emptyForm;

function toForm(book: Partial<Book>): FormState {
  return {
    ...emptyForm,
    ...Object.fromEntries(
      Object.entries(book).filter(([, v]) => v !== undefined && v !== null)
    ),
    startDate: book.startDate ?? "",
    endDate: book.endDate ?? "",
  } as FormState;
}

export function BookForm({
  book,
  initial,
  notice,
}: {
  /** 編輯既有書籍 */
  book?: Book;
  /** 新增時，由查詢步驟帶進來的預填資料 */
  initial?: Partial<Book>;
  /** 查詢步驟要轉達的訊息（例如查不到） */
  notice?: string;
}) {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();
  const [form, setForm] = useState<FormState>(toForm(book ?? initial ?? {}));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = Boolean(book);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
      coverUrl: form.coverUrl,
      publisher: form.publisher,
      platform: form.platform,
      sourceUrl: form.sourceUrl,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      domain: form.domain,
      type: form.type,
      language: form.language,
      pageCount: form.pageCount,
      wordCount: form.wordCount,
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

      await mutate();
      router.push("/books");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!book || !sheetId) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(
        `/api/books/${book.id}?sheetId=${encodeURIComponent(sheetId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "刪除失敗");
      }
      await mutate(
        (current) => ({ books: (current?.books ?? []).filter((b) => b.id !== book.id) }),
        { revalidate: false }
      );
      router.push("/books");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "刪除失敗");
      setSubmitting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-5">
      {notice && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="書名" value={form.title} onChange={(v) => set("title", v)} required />
        <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />
        <Field label="出版社" value={form.publisher} onChange={(v) => set("publisher", v)} />
        <Field label="封面 URL" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />
        <Field label="頁數" value={form.pageCount} onChange={(v) => set("pageCount", v)} />
        <Field label="字數" value={form.wordCount} onChange={(v) => set("wordCount", v)} />
        <Field label="來源網址" value={form.sourceUrl} onChange={(v) => set("sourceUrl", v)} />

        <div>
          <label className="mb-1 block text-sm font-medium">平台</label>
          <select
            value={form.platform}
            onChange={(e) => set("platform", e.target.value as BookPlatform)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {BOOK_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">閱讀狀態</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as ReadingStatus)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {READING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Field label="開始日期" type="date" value={form.startDate} onChange={(v) => set("startDate", v)} />
        <Field label="完成日期" type="date" value={form.endDate} onChange={(v) => set("endDate", v)} />

        <CategorySelect
          label="領域"
          categoryKey="domain"
          value={form.domain}
          onChange={(v) => set("domain", v)}
        />
        <CategorySelect
          label="屬性"
          categoryKey="type"
          value={form.type}
          onChange={(v) => set("type", v)}
        />
        <CategorySelect
          label="語言"
          categoryKey="language"
          value={form.language}
          onChange={(v) => set("language", v)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">筆記</label>
        <textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          rows={3}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {submitError && <p className="text-xs text-red-600">{submitError}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "儲存中…" : isEdit ? "儲存變更" : "新增書籍"}
        </button>

        {/* 刪除只出現在編輯頁，按一次先要求確認，避免誤刪 */}
        {isEdit &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">確定刪除這本書？</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                刪除
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              刪除這本書
            </button>
          ))}
      </div>
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
      <label className="mb-1 block text-sm font-medium">{label}</label>
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

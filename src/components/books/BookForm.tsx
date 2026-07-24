"use client";

import { useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import { Book, BookPlatform } from "@/types/book";

const PLATFORMS: BookPlatform[] = [
  "博客來",
  "讀墨",
  "Kobo",
  "Kindle",
  "Hyread",
  "Pubu",
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

export function BookForm() {
  const { categories, addBook, addCategoryOption } = useBookStore();
  const [form, setForm] = useState(emptyForm);

  function set<K extends keyof typeof emptyForm>(key: K, value: typeof emptyForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const book: Book = {
      id: crypto.randomUUID(),
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

    addBook(book);
    if (form.domain) addCategoryOption("domain", form.domain);
    if (form.type) addCategoryOption("type", form.type);
    if (form.language) addCategoryOption("language", form.language);

    setForm(emptyForm);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">書籍 URL</label>
        <input
          type="url"
          placeholder="貼上博客來 / 讀墨 / Kobo 等連結"
          value={form.sourceUrl}
          onChange={(e) => set("sourceUrl", e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          自動爬蟲功能尚未串接，請先手動輸入以下欄位。
        </p>
      </div>

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

      <button
        type="submit"
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        新增書籍
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

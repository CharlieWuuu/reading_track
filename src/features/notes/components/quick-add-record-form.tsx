"use client";

import { useState } from "react";
import { BookPicker } from "@/features/notes/components/book-picker";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { Book } from "@/types/book";
import { EMPTY_QUOTE, EMPTY_VOCABULARY, QuoteRow, VocabularyRow } from "@/types/record";

type Kind = "quotes" | "vocabulary";
type Field = { key: string; label: string; multiline?: boolean };

/** 第一個欄位是必填的那個：句子與單字，其餘都可以之後再補 */
const FIELDS: Record<Kind, Field[]> = {
  quotes: [
    { key: "text", label: "句子", multiline: true },
    { key: "chapter", label: "章節" },
    { key: "note", label: "心得", multiline: true },
  ],
  vocabulary: [
    { key: "word", label: "單字" },
    { key: "pronunciation", label: "怎麼唸" },
    { key: "wordTranslation", label: "意思" },
    { key: "sentence", label: "例句", multiline: true },
    { key: "sentenceTranslation", label: "例句翻譯" },
    { key: "chapter", label: "章節" },
  ],
};

const EMPTY: Record<Kind, Record<string, string>> = {
  quotes: EMPTY_QUOTE,
  vocabulary: EMPTY_VOCABULARY,
};

const styles = {
  form: "flex flex-col gap-3",
  field: "flex flex-col gap-1",
  label: "text-xs font-medium text-gray-500",
  input: "w-full rounded-control border px-3 py-2 text-sm",
  area: "min-h-24 w-full resize-none rounded-control border px-3 py-2 text-sm",
  actions: "flex items-center gap-2 pt-1",
  save: "rounded-control bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  note: "text-xs text-gray-500",
  error: "text-xs text-red-600",
};

/**
 * 快速記一句／一個字，不用穿過整本書的表單。
 *
 * 存完留在原地並清空欄位、書留著——抄書通常一次抄好幾句，跳走等於每句都要重來。
 */
export function QuickAddRecordForm({ kind, onSaved }: { kind: Kind; onSaved?: () => void }) {
  const { books } = useBooks();
  const { quotes, vocabulary, saveBookRows } = useRecords();
  const [book, setBook] = useState<Book | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY[kind] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(0);

  const fields = FIELDS[kind];
  const required = fields[0].key;
  const canSave = Boolean(book) && Boolean(form[required]?.trim()) && !saving;

  async function save() {
    if (!book) return;
    setSaving(true);
    setError("");
    try {
      // 整批取代是後端的約定，所以要把這本書現有的那幾列一起送回去
      const existing = (kind === "quotes" ? quotes : vocabulary).filter(
        (r) => r.bookId === book.id,
      );
      const row = {
        id: crypto.randomUUID(),
        bookId: book.id,
        bookTitle: book.title,
        ...EMPTY[kind],
        ...form,
      };
      await saveBookRows(kind, book.id, book.title, [...existing, row] as
        QuoteRow[] | VocabularyRow[]);
      setForm({ ...EMPTY[kind] }); // 書留著，內容清掉
      setSaved((n) => n + 1);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) save();
      }}
    >
      <BookPicker books={books} value={book} onChange={setBook} />

      {fields.map((field) => (
        <div key={field.key} className={styles.field}>
          <label className={styles.label} htmlFor={field.key}>
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              id={field.key}
              value={form[field.key] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              className={styles.area}
            />
          ) : (
            <input
              id={field.key}
              value={form[field.key] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              className={styles.input}
            />
          )}
        </div>
      ))}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="submit" disabled={!canSave} className={styles.save}>
          {saving ? "儲存中…" : "存下來"}
        </button>
        {saved > 0 && !saving && <span className={styles.note}>已存 {saved} 筆</span>}
      </div>
    </form>
  );
}

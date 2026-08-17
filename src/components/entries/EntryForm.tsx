"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Link as LinkIcon, NotebookPen, Shapes, Tag } from "lucide-react";
import { CategorySelect } from "@/components/books/CategorySelect";
import { compactLines, LineListInput } from "@/components/books/LineListInput";
import { Field } from "@/components/ui/Field";
import { useArticles } from "@/lib/useArticles";
import { useBooks } from "@/lib/useBooks";
import { useEntries } from "@/lib/useEntries";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { useSheetStore } from "@/store/useSheetStore";
import { splitLines } from "@/types/book";
import { Entry } from "@/types/entry";
import { EMPTY_KEYWORD_INFO } from "@/types/keyword";
import { KeywordEditDialog } from "../keywords/KeywordEditDialog";

const TEXTAREA_CLASS = "min-h-48 w-full flex-1 resize-none rounded border px-3 py-2 text-sm";

/** 新增時預設今天：想記的多半是剛發生的事，每次都要點日曆很煩 */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const emptyForm = {
  date: "",
  title: "",
  kind: "",
  domain: "",
  subDomain: "",
  keywords: "",
  note: "",
  link: "",
};

type FormState = typeof emptyForm;

function toForm(entry?: Entry): FormState {
  if (!entry) return { ...emptyForm, date: today() };
  return {
    ...emptyForm,
    ...Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined && v !== null)),
    date: entry.date ?? "",
  } as FormState;
}

/**
 * 一件事 + 我怎麼想。心得欄是主體，其他欄位都是為了讓它之後找得到。
 */
export function EntryForm({ entry }: { entry?: Entry }) {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const { entries, mutate } = useEntries();
  const { books } = useBooks();
  const { articles } = useArticles();
  const isEdit = Boolean(entry);

  // 關鍵字的建議跨書、文章、紀事一起收，同一個詞才不會出現三種寫法
  const keywordSuggestions = [
    ...new Set([...books, ...articles, ...entries].flatMap((item) => splitLines(item.keywords))),
  ].sort((a, b) => a.localeCompare(b, "zh-Hant"));

  const [form, setForm] = useState<FormState>(toForm(entry));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const { byName: keywordInfos, save: saveKeyword } = useKeywordInfos();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setSubmitError("請填標題");
      return;
    }
    if (!sheetId) {
      setSubmitError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    const payload = {
      ...form,
      date: form.date || null,
      keywords: compactLines(form.keywords),
    };

    setSubmitting(true);
    setSubmitError("");
    try {
      if (isEdit && entry) {
        const res = await fetch(`/api/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newEntry: Entry = { id: crypto.randomUUID(), ...payload };
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, entry: newEntry }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
      }

      await mutate();
      router.push("/entries");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!entry || !sheetId) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/entries/${entry.id}?sheetId=${encodeURIComponent(sheetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "刪除失敗");
      }
      await mutate(
        (current) => ({ entries: (current?.entries ?? []).filter((e) => e.id !== entry.id) }),
        { revalidate: false },
      );
      router.push("/entries");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "刪除失敗");
      setSubmitting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:h-full md:min-h-0">
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
        <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3">
          <div className="col-span-2">
            <Field label="標題" value={form.title} onChange={(v) => set("title", v)} />
          </div>

          <Field
            label="日期"
            Icon={CalendarCheck}
            type="date"
            value={form.date}
            onChange={(v) => set("date", v)}
          />
          <CategorySelect
            label="類型"
            Icon={Shapes}
            categoryKey="kind"
            value={form.kind}
            onChange={(v) => set("kind", v)}
          />

          <CategorySelect
            label="領域"
            categoryKey="domain"
            value={form.domain}
            onChange={(v) => set("domain", v)}
          />
          <CategorySelect
            label="次領域"
            categoryKey="subDomain"
            value={form.subDomain}
            onChange={(v) => set("subDomain", v)}
          />

          {/* 事件本身留在原本的系統裡，這裡只指過去；不是每件事都在線上，純文字也算 */}
          <div className="col-span-2">
            <Field
              label="來源"
              Icon={LinkIcon}
              hint="網址或純文字都可以，例如「紙本日記 8/17」"
              value={form.link}
              onChange={(v) => set("link", v)}
            />
          </div>
        </div>

        {/* 心得放最大：它是這張表唯一的主體，其他欄位都是為了讓它找得到 */}
        <div className="flex min-h-0 flex-col gap-3 sm:flex-row md:flex-1">
          <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-2/3">
            <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
              <NotebookPen size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
              心得
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/3">
            <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
              <Tag size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
              關鍵字
            </label>
            <LineListInput
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              placeholder="注意力"
              suggestions={keywordSuggestions}
              onEditRow={setEditingKeyword}
            />
          </div>
        </div>
      </div>

      {submitError && <p className="shrink-0 text-xs text-red-600">{submitError}</p>}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "儲存中…" : isEdit ? "儲存變更" : "新增紀事"}
        </button>

        {/* 刪除只出現在編輯頁，按一次先要求確認，避免誤刪 */}
        {isEdit &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">確定刪除這一筆？</span>
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
              刪除這一筆
            </button>
          ))}
      </div>

      {editingKeyword && (
        <KeywordEditDialog
          info={keywordInfos.get(editingKeyword) ?? { name: editingKeyword, ...EMPTY_KEYWORD_INFO }}
          onSave={saveKeyword}
          onClose={() => setEditingKeyword(null)}
        />
      )}
    </form>
  );
}

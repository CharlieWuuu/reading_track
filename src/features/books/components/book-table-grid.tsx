"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { BookCover } from "@/components/ui/book-cover";
import { StatusBadge, TagList } from "@/components/ui/tag-badge";
import { searchBookByTitle } from "@/features/books/api/lookup-book";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { fullerTitle } from "@/lib/metadata";
import { Book } from "@/types/book";

/**
 * 書籍表格的桌機檢視，含 inline 編輯。
 *
 * 兩種進入編輯的方式，共用同一套欄位輸入邏輯：
 * - 單列點「編輯」：那一列的文字型欄位換成輸入框，存檔後回到唯讀展示
 * - 頁首「編輯模式」總開關：所有列同時換成輸入框，各自獨立存檔——
 *   適合一次補齊一整批資料，不用一列一列點開
 *
 * 狀態不開放編輯——它是由開始／完成日期推導出來的（見 inferStatus），
 * 直接改狀態跟改日期會互相矛盾；要換狀態，改日期就好。
 * 封面也不開放——需要另外的上傳流程，跟這裡的文字欄位不是同一件事。
 *
 * 「補齊」按鈕只在編輯狀態出現：用書名查一次書籍資料庫，補上目前是空的欄位
 * （書名本身取較完整的那個版本），跟表單頁「重新抓取」同一套規則，
 * 只是這裡不透過 useBookRefetch（那支綁在單一表單的 store，表格要能同時對
 * 每一列各自查，改直接呼叫底層的 searchBookByTitle）。
 */

type EditableField =
  "title" | "author" | "platform" | "startDate" | "endDate" | "domain" | "type" | "language";

type EditForm = Record<EditableField, string>;

function toEditForm(book: Book): EditForm {
  return {
    title: book.title,
    author: book.author,
    platform: book.platform,
    startDate: book.startDate ?? "",
    endDate: book.endDate ?? "",
    domain: book.domain,
    type: book.type,
    language: book.language,
  };
}

const inputClass = "border-rule-strong w-full rounded-control border bg-white px-1.5 py-1 text-xs";

export function BookTableGrid({
  books,
  numbers,
  detailHref,
  onSaved,
  editAll = false,
}: {
  books: Book[];
  numbers: Map<string, number>;
  detailHref: (id: string) => string;
  onSaved: () => unknown;
  /** 頁首總開關開著：所有列一起進編輯狀態，不用逐列點「編輯」 */
  editAll?: boolean;
}) {
  const router = useRouter();
  const { editingId, startEdit, cancelEdit, save, saving, error } = useInlineEdit<Book>(
    "books",
    onSaved,
  );
  const [form, setForm] = useState<EditForm | null>(null);
  // editAll 開著時每一列各自存一份表單，key 是書的 id；不影響單列編輯用的 form
  const [allForms, setAllForms] = useState<Record<string, EditForm>>({});
  // 正在補齊資料的那一列，同時只查一筆，按鈕顯示轉圈
  const [fillingId, setFillingId] = useState<string | null>(null);

  function beginEdit(book: Book) {
    setForm(toEditForm(book));
    startEdit(book.id);
  }

  function cancel() {
    setForm(null);
    cancelEdit();
  }

  async function submit(id: string) {
    if (!form) return;
    await save(id, {
      ...form,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    });
    setForm(null);
  }

  // editAll 用的表單：第一次碰到這本書才從書的現有值起草，之後改過的字不會被書的原值蓋掉
  function formFor(book: Book): EditForm {
    return allForms[book.id] ?? toEditForm(book);
  }

  function setFieldFor(book: Book, field: EditableField, value: string) {
    setAllForms((prev) => ({ ...prev, [book.id]: { ...formFor(book), [field]: value } }));
  }

  async function submitRow(book: Book) {
    const rowForm = allForms[book.id];
    if (!rowForm) return;
    await save(book.id, {
      ...rowForm,
      startDate: rowForm.startDate || null,
      endDate: rowForm.endDate || null,
    });
    setAllForms((prev) => {
      const rest = { ...prev };
      delete rest[book.id];
      return rest;
    });
  }

  // 只補空欄位：使用者手動改過的內容比外部來源可信，不能被一鍵蓋掉。
  // 書名是唯一例外，抓到更完整的版本（多半是補上副標題）就換掉——跟表單頁同一套規則
  async function fillGaps(book: Book) {
    const current = editAll ? formFor(book) : form;
    if (!current || !current.title.trim()) return;

    setFillingId(book.id);
    try {
      const found = await searchBookByTitle(current.title);
      if (!found) return;

      const next = { ...current };
      for (const [key, value] of Object.entries(found)) {
        if (!(key in next) || typeof value !== "string" || !value.trim()) continue;
        if (String(next[key as EditableField] ?? "").trim()) continue;
        next[key as EditableField] = value;
      }
      const fuller = fullerTitle(current.title, found.title);
      if (fuller) next.title = fuller;

      if (editAll) {
        setAllForms((prev) => ({ ...prev, [book.id]: next }));
      } else {
        setForm(next);
      }
    } finally {
      setFillingId(null);
    }
  }

  return (
    <div className="hidden w-full overflow-x-auto md:block">
      {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
      <table className="w-full min-w-[1100px] table-fixed">
        <thead className="border-rule-strong bg-background sticky top-0 z-10 border-b text-center">
          <tr className="text-label text-ink-faint tracking-label [&_th]:font-normal">
            <th className="w-16 px-3 py-2 whitespace-nowrap">封面</th>
            <th className="w-56 px-3 py-2 whitespace-nowrap">書名</th>
            <th className="w-32 px-3 py-2 whitespace-nowrap">作者</th>
            <th className="w-20 px-3 py-2 whitespace-nowrap">狀態</th>
            <th className="w-24 px-3 py-2 whitespace-nowrap">平台</th>
            <th className="w-24 px-3 py-2 whitespace-nowrap">開始日期</th>
            <th className="w-24 px-3 py-2 whitespace-nowrap">完成日期</th>
            <th className="w-24 px-3 py-2 whitespace-nowrap">領域</th>
            <th className="w-24 px-3 py-2 whitespace-nowrap">屬性</th>
            <th className="w-16 px-3 py-2 whitespace-nowrap">語言</th>
            <th className="w-16 px-3 py-2 whitespace-nowrap">編輯</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b, i) => {
            const singleEditing = editingId === b.id;
            // editAll 開著時每一列都在編輯；否則只有被單獨點開的那一列
            const editing = editAll || singleEditing;
            const rowForm = editAll ? formFor(b) : form;
            const setField = (field: EditableField, value: string) =>
              editAll
                ? setFieldFor(b, field, value)
                : setForm(form ? { ...form, [field]: value } : form);
            return (
              <tr
                key={b.id || `row-${i}`}
                onClick={editing ? undefined : () => router.push(detailHref(b.id))}
                className={`border-rule border-t first:border-t-0 ${editing ? "" : "hover:bg-control-bg-hover/5 cursor-pointer"}`}
              >
                <td className="px-3 py-2">
                  <BookCover url={b.coverUrl} title={b.title} size="md" />
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2 align-middle">
                  {editing && rowForm ? (
                    <input
                      className={inputClass}
                      value={rowForm.title}
                      onChange={(e) => setField("title", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex flex-col justify-center">
                      {numbers.has(b.id) && (
                        <span className="text-meta text-ink-faint tabular-nums">
                          #{numbers.get(b.id)}
                        </span>
                      )}
                      <span className="text-item-sm overflow-hidden font-serif font-semibold tracking-tight text-ellipsis whitespace-nowrap">
                        {b.title}
                      </span>
                    </div>
                  )}
                </td>
                <td className="text-byline text-ink-muted max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
                  {editing && rowForm ? (
                    <input
                      className={inputClass}
                      value={rowForm.author}
                      onChange={(e) => setField("author", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {b.author}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <StatusBadge status={b.status} />
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2">
                  {editing && rowForm ? (
                    <input
                      className={inputClass}
                      value={rowForm.platform}
                      onChange={(e) => setField("platform", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <TagList values={[b.platform]} tone="platform" wrap={false} />
                  )}
                </td>
                <td className="text-meta text-ink-faint max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
                  {editing && rowForm ? (
                    <input
                      type="date"
                      className={inputClass}
                      value={rowForm.startDate}
                      onChange={(e) => setField("startDate", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                      {b.startDate ?? "—"}
                    </span>
                  )}
                </td>
                <td className="text-meta text-ink-faint max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
                  {editing && rowForm ? (
                    <input
                      type="date"
                      className={inputClass}
                      value={rowForm.endDate}
                      onChange={(e) => setField("endDate", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                      {b.endDate ?? "—"}
                    </span>
                  )}
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2">
                  {editing && rowForm ? (
                    <input
                      className={inputClass}
                      value={rowForm.domain}
                      onChange={(e) => setField("domain", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <TagList values={[b.domain]} tone="domain" wrap={false} />
                  )}
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2">
                  {editing && rowForm ? (
                    <input
                      className={inputClass}
                      value={rowForm.type}
                      onChange={(e) => setField("type", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <TagList values={[b.type]} tone="type" wrap={false} />
                  )}
                </td>
                <td className="text-byline text-ink-muted max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
                  {editing && rowForm ? (
                    <input
                      className={inputClass}
                      value={rowForm.language}
                      onChange={(e) => setField("language", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {b.language}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {editAll ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={fillingId === b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          fillGaps(b);
                        }}
                        className="rounded-control hover:bg-control-bg-hover p-1 text-gray-400 disabled:opacity-50"
                        aria-label="補齊資料"
                        title="用書名查詢，補上空欄位"
                      >
                        <Sparkles size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={(e) => {
                          e.stopPropagation();
                          submitRow(b);
                        }}
                        className="rounded-control text-accent hover:bg-control-bg-hover p-1 disabled:opacity-50"
                        aria-label="儲存這一列"
                      >
                        <Check size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : editing ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={fillingId === b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          fillGaps(b);
                        }}
                        className="rounded-control hover:bg-control-bg-hover p-1 text-gray-400 disabled:opacity-50"
                        aria-label="補齊資料"
                        title="用書名查詢，補上空欄位"
                      >
                        <Sparkles size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={(e) => {
                          e.stopPropagation();
                          submit(b.id);
                        }}
                        className="rounded-control text-accent hover:bg-control-bg-hover p-1 disabled:opacity-50"
                        aria-label="儲存"
                      >
                        <Check size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={(e) => {
                          e.stopPropagation();
                          cancel();
                        }}
                        className="rounded-control hover:bg-control-bg-hover p-1 text-gray-400 disabled:opacity-50"
                        aria-label="取消"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        beginEdit(b);
                      }}
                      className="rounded-control hover:bg-control-bg-hover p-1 text-gray-400"
                      aria-label="編輯"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { BookCover } from "@/components/ui/book-cover";
import { StatusBadge, TagList } from "@/components/ui/tag-badge";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { Book } from "@/types/book";

/**
 * 書籍表格的桌機檢視，含 inline 編輯：點「編輯」欄位的按鈕，那一列的
 * 文字型欄位（書名、作者、平台、日期、領域、屬性、語言）換成輸入框，
 * 存檔後回到唯讀展示。
 *
 * 狀態不開放編輯——它是由開始／完成日期推導出來的（見 inferStatus），
 * 直接改狀態跟改日期會互相矛盾；要換狀態，改日期就好。
 * 封面也不開放——需要另外的上傳流程，跟這裡的文字欄位不是同一件事。
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
}: {
  books: Book[];
  numbers: Map<string, number>;
  detailHref: (id: string) => string;
  onSaved: () => unknown;
}) {
  const router = useRouter();
  const { editingId, startEdit, cancelEdit, save, saving, error } = useInlineEdit<Book>(
    "books",
    onSaved,
  );
  const [form, setForm] = useState<EditForm | null>(null);

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

  return (
    <div className="hidden w-full md:block">
      {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
      <table className="w-full table-fixed">
        <thead className="border-rule-strong bg-background sticky top-0 z-10 border-b text-left">
          <tr className="text-label text-ink-faint tracking-label [&_th]:font-normal">
            <th className="w-[5%] px-3 py-2 whitespace-nowrap">封面</th>
            <th className="w-[22%] px-3 py-2 whitespace-nowrap">書名</th>
            <th className="w-[11%] px-3 py-2 whitespace-nowrap">作者</th>
            <th className="w-[8%] px-3 py-2 whitespace-nowrap">狀態</th>
            <th className="hidden w-[9%] px-3 py-2 whitespace-nowrap lg:table-cell">平台</th>
            <th className="hidden w-[9%] px-3 py-2 whitespace-nowrap xl:table-cell">開始日期</th>
            <th className="hidden w-[9%] px-3 py-2 whitespace-nowrap lg:table-cell">完成日期</th>
            <th className="hidden w-[9%] px-3 py-2 whitespace-nowrap lg:table-cell">領域</th>
            <th className="hidden w-[9%] px-3 py-2 whitespace-nowrap xl:table-cell">屬性</th>
            <th className="hidden w-[5%] px-3 py-2 whitespace-nowrap 2xl:table-cell">語言</th>
            <th className="w-[4%] px-3 py-2 whitespace-nowrap">編輯</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b, i) => {
            const editing = editingId === b.id;
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
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
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
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <TagList values={[b.platform]} tone="platform" wrap={false} />
                  )}
                </td>
                <td className="text-meta text-ink-faint hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap xl:table-cell">
                  {editing && form ? (
                    <input
                      type="date"
                      className={inputClass}
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                      {b.startDate ?? "—"}
                    </span>
                  )}
                </td>
                <td className="text-meta text-ink-faint hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                  {editing && form ? (
                    <input
                      type="date"
                      className={inputClass}
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                      {b.endDate ?? "—"}
                    </span>
                  )}
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.domain}
                      onChange={(e) => setForm({ ...form, domain: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <TagList values={[b.domain]} tone="domain" wrap={false} />
                  )}
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 xl:table-cell">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <TagList values={[b.type]} tone="type" wrap={false} />
                  )}
                </td>
                <td className="text-byline text-ink-muted hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap 2xl:table-cell">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {b.language}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {editing ? (
                    <div className="flex items-center gap-1">
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { BookCover } from "@/components/ui/book-cover";
import { ListHeading } from "@/components/ui/list-heading";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { OverviewItem } from "@/utils/overview";

/**
 * 堆概覽的表格檢視。一列一筆，欄位對齊，掃描與比較用——跟概覽的「摘要」是兩種目的。
 *
 * 混排多種類型，所以第一欄永遠是類型；書籍、電影有封面，佳句、日記沒有，
 * 沒有封面的那一欄就空著，不畫佔位框。
 *
 * 手機版收成卡片列表，橫向表格在窄螢幕上欄位會擠到看不清楚。
 *
 * inline 編輯只開放標題與日期：混排的類型五花八門，只有這兩欄的名字在
 * /api/catalog/[id] 認得的欄位裡是共通的（title、startDate、endDate），
 * 其餘欄位各類型形狀都不一樣，要編就得進各自的詳細頁。
 *
 * 日期編的是「顯示的那一欄」：有完成日期就編完成日期，只有開始日期
 * （還在進行中）就編開始日期——送錯欄位會把進行中的項目誤標成完成。
 */

const styles = {
  wrap: "flex flex-col gap-3",
  table: "hidden md:table w-full border-collapse text-left",
  th: "text-label text-ink-faint tracking-label border-rule-strong border-b-2 pb-2 font-medium",
  td: "border-rule border-b py-2.5 align-top",
  title: "font-serif text-item-sm font-semibold",
  byline: "text-byline text-ink-muted",
  meta: "text-meta text-ink-faint tabular-nums",
  kind: "text-label text-ink-faint tracking-label",
  cover: "h-10 w-7 shrink-0",
  mobileList: "flex flex-col md:hidden",
  mobileRow: "border-rule flex items-center gap-3 border-b py-2.5",
  input: "border-rule-strong w-full rounded-control border bg-white px-1.5 py-1 text-xs",
};

type EditForm = { title: string; date: string; dateField: "startDate" | "endDate" };

export function GroupTable({
  items,
  onSaved,
}: {
  items: readonly OverviewItem[];
  onSaved: () => unknown;
}) {
  const { editingId, startEdit, cancelEdit, save, saving, error } = useInlineEdit<
    Record<string, string>
  >("catalog", onSaved, { bodyKey: "values" });
  const [form, setForm] = useState<EditForm | null>(null);

  function beginEdit(item: OverviewItem) {
    const dateField = item.endDate ? "endDate" : "startDate";
    setForm({ title: item.title, date: item[dateField] ?? "", dateField });
    startEdit(item.id);
  }

  function cancel() {
    setForm(null);
    cancelEdit();
  }

  async function submit(id: string) {
    if (!form) return;
    await save(id, { title: form.title, [form.dateField]: form.date });
    setForm(null);
  }

  return (
    <div className={styles.wrap}>
      <ListHeading label="全部" count={items.length} />
      {error && <p className="text-xs text-red-600">{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.th} w-10`}></th>
            <th className={`${styles.th} w-20`}>類型</th>
            <th className={styles.th}>標題</th>
            <th className={`${styles.th} w-24`}>日期</th>
            <th className={`${styles.th} w-16`}>編輯</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const editing = editingId === item.id;
            return (
              <tr key={item.id}>
                <td className={styles.td}>
                  {item.coverUrl !== undefined && (
                    <div className={styles.cover}>
                      <BookCover url={item.coverUrl} title={item.title} size="full" />
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  <span className={styles.kind}>{item.kindLabel}</span>
                </td>
                <td className={styles.td}>
                  {editing && form ? (
                    <input
                      className={styles.input}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  ) : (
                    <>
                      <Link href={item.href} className={styles.title}>
                        {item.title}
                      </Link>
                      {item.byline && <div className={styles.byline}>{item.byline}</div>}
                    </>
                  )}
                </td>
                <td className={styles.td}>
                  {editing && form ? (
                    <input
                      type="date"
                      className={styles.input}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  ) : (
                    <span className={styles.meta}>{item.endDate ?? item.startDate ?? ""}</span>
                  )}
                </td>
                <td className={styles.td}>
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => submit(item.id)}
                        className="rounded-control text-accent hover:bg-control-bg-hover p-1 disabled:opacity-50"
                        aria-label="儲存"
                      >
                        <Check size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={cancel}
                        className="rounded-control hover:bg-control-bg-hover p-1 text-gray-400 disabled:opacity-50"
                        aria-label="取消"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginEdit(item)}
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

      <div className={styles.mobileList}>
        {items.map((item) => (
          <Link key={item.id} href={item.href} className={styles.mobileRow}>
            {item.coverUrl !== undefined && (
              <div className={styles.cover}>
                <BookCover url={item.coverUrl} title={item.title} size="full" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={styles.kind}>{item.kindLabel}</span>
                <span className={styles.meta}>{item.endDate ?? item.startDate ?? ""}</span>
              </div>
              <p className={`${styles.title} truncate`}>{item.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

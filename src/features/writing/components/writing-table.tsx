"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { writingHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";
import { shortDate } from "@/utils/date";
import { tagColorClass } from "@/utils/tag-colors";

/**
 * 書寫的表格檢視：一列一則，只放標題那一行。
 *
 * 內文刻意不進表格——紀事的內文長短差很多，塞進格子裡不是被截斷就是把列撐高，
 * 兩種都讓「這陣子寫了什麼」變得難掃。要看內容點進去就好，表格負責找到那一則。
 *
 * 日期擺第一欄，只寫 `08/19`：一整欄同寬的數字，往下掃就是一條時間軸。
 * 完整年份沒有意義——同一個畫面裡的紀事幾乎都是今年的，跨年的才補上。
 *
 * 窄螢幕不再藏欄位，改成整張表左右滑——藏起來的欄位在手機上等於不存在。
 *
 * 「編輯」欄位點下去，那一列的日期、主題、標題、關鍵字換成輸入框；
 * 「延伸自」不開放 inline 改——換出處要挑書或文章，跟這裡的文字欄位不是同一件事。
 */
/**
 * 同一天的幾則是一組，換一天就換底色（只兩階交替）。
 *
 * 一天常常有三五則，全部同色會分不出「這幾則是同一天」；日期只寫在第一欄，
 * 底色補的正是那條看不見的分組線。做法跟書單用年份交替是同一個。
 */
function dayTone(group: number): string {
  return group % 2 === 1 ? "bg-gray-100 hover:bg-gray-200" : "bg-white hover:bg-gray-50";
}

/** 主題與關鍵字的長相跟時間軸那邊同一套：同一個東西在兩個檢視裡不該換臉 */
const styles = {
  kind: "rounded-control shrink-0 px-1 py-px text-[10px] leading-none font-medium",
  tag: "rounded-control shrink-0 bg-gray-100 px-1 py-px text-[10px] text-gray-500 hover:bg-gray-200",
};

const inputClass = "border-rule-strong w-full rounded-control border bg-white px-1.5 py-1 text-xs";

type EditForm = {
  date: string;
  topic: string;
  title: string;
  keywords: string;
};

function toEditForm(writing: Writing): EditForm {
  return {
    date: writing.date ?? "",
    topic: writing.topic,
    title: writing.title,
    keywords: writing.keywords,
  };
}

export function WritingTable({
  writings,
  onSaved,
}: {
  writings: Writing[];
  onSaved: () => unknown;
}) {
  const router = useRouter();
  const { editingId, startEdit, cancelEdit, save, saving, error } = useInlineEdit<Writing>(
    "writings",
    onSaved,
  );
  const [form, setForm] = useState<EditForm | null>(null);

  // 每一列屬於第幾組（＝上面換過幾次日期）。相鄰同一天的共用一個組號
  const groupIndex = writings.reduce<number[]>((acc, e, i) => {
    const changed = i > 0 && e.date !== writings[i - 1].date;
    acc.push(i === 0 ? 0 : acc[i - 1] + (changed ? 1 : 0));
    return acc;
  }, []);

  function beginEdit(writing: Writing) {
    setForm(toEditForm(writing));
    startEdit(writing.id);
  }

  function cancel() {
    setForm(null);
    cancelEdit();
  }

  async function submit(id: string) {
    if (!form) return;
    await save(id, { ...form, date: form.date || null });
    setForm(null);
  }

  return (
    // 這一張靠 min-w 撐出橫向捲軸，overflow-x 會連帶讓 y 也變 auto，
    // 所以它一定是自己的捲動容器。底部那一格補上，捲到底的留白跟別頁一樣
    <div className="min-h-0 w-full flex-1 overflow-auto border-y bg-white">
      {error && <p className="px-2 py-1.5 text-xs text-red-600">{error}</p>}
      {/* min-w 撐出橫向捲軸：窄螢幕滑著看，寬螢幕照百分比分配 */}
      <table className="w-full min-w-[36rem] table-fixed text-sm">
        <thead className="bg-table-header-bg sticky top-0 z-10 text-left [&_th]:shadow-[inset_0_-1px_0_var(--color-table-header-rule)]">
          <tr>
            <th className="w-[9%] px-2 py-1.5 whitespace-nowrap">日期</th>
            <th className="w-[13%] px-2 py-1.5 whitespace-nowrap">主題</th>
            <th className="w-[30%] px-2 py-1.5 whitespace-nowrap">標題</th>
            <th className="w-[20%] px-2 py-1.5 whitespace-nowrap">關鍵字</th>
            <th className="w-[19%] px-2 py-1.5 whitespace-nowrap">延伸自</th>
            <th className="w-[9%] px-2 py-1.5 whitespace-nowrap">編輯</th>
          </tr>
        </thead>
        <tbody>
          {writings.map((e, i) => {
            const editing = editingId === e.id;
            return (
              <tr
                key={e.id}
                onClick={editing ? undefined : () => router.push(writingHref(e.id))}
                className={`border-t first:border-t-0 ${editing ? "bg-white" : `cursor-pointer ${dayTone(groupIndex[i])}`}`}
              >
                {/* 日期是對齊用的座標，不是要讀的內容，比其他欄小一級 */}
                <td className="px-2 py-1.5 text-xs whitespace-nowrap text-gray-500 tabular-nums">
                  {editing && form ? (
                    <input
                      type="date"
                      className={inputClass}
                      value={form.date}
                      onChange={(ev) => setForm({ ...form, date: ev.target.value })}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                  ) : (
                    shortDate(e.date) || "—"
                  )}
                </td>
                <td className="max-w-0 overflow-hidden px-2 py-1.5">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.topic}
                      onChange={(ev) => setForm({ ...form, topic: ev.target.value })}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                  ) : (
                    e.topic && (
                      <span className={`${styles.kind} ${tagColorClass(e.topic, [])}`}>
                        {e.topic}
                      </span>
                    )
                  )}
                </td>
                {/* max-w-0 + overflow-hidden：table-fixed 下過長的標題會擠進隔壁欄，寧可切掉 */}
                <td className="max-w-0 overflow-hidden px-2 py-1.5">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.title}
                      onChange={(ev) => setForm({ ...form, title: ev.target.value })}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                  ) : (
                    <span className="block overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                      {e.title || "（沒有標題）"}
                    </span>
                  )}
                </td>
                {/* 關鍵字是一行一個，不是頓號分隔——splitTags 會把整段當成一個標籤 */}
                <td className="max-w-0 overflow-hidden px-2 py-1.5">
                  {editing && form ? (
                    <input
                      className={inputClass}
                      value={form.keywords}
                      onChange={(ev) => setForm({ ...form, keywords: ev.target.value })}
                      onClick={(ev) => ev.stopPropagation()}
                      placeholder="一行一個"
                    />
                  ) : (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="flex flex-nowrap gap-1"
                    >
                      {splitLines(e.keywords).map((name) => (
                        <KeywordTag key={name} name={name} className={styles.tag} />
                      ))}
                    </div>
                  )}
                </td>
                <td className="max-w-0 overflow-hidden px-2 py-1.5">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-gray-500">
                    {e.sourceTitle}
                  </span>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          submit(e.id);
                        }}
                        className="rounded-control text-accent hover:bg-control-bg-hover p-1 disabled:opacity-50"
                        aria-label="儲存"
                      >
                        <Check size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={(ev) => {
                          ev.stopPropagation();
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
                      onClick={(ev) => {
                        ev.stopPropagation();
                        beginEdit(e);
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
      <div className="h-6 shrink-0" />
    </div>
  );
}

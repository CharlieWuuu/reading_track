"use client";

import { useRouter } from "next/navigation";
import { TagList } from "@/components/ui/tag-badge";
import { writingEditHref } from "@/config/routes";
import { splitTags } from "@/types/book";
import { Writing } from "@/types/writing";

/**
 * 書寫的表格檢視：一列一則，只放標題那一行。
 *
 * 內文刻意不進表格——紀事的內文長短差很多，塞進格子裡不是被截斷就是把列撐高，
 * 兩種都讓「這陣子寫了什麼」變得難掃。要看內容點進去就好，表格負責找到那一則。
 *
 * 窄螢幕只留日期與標題，其餘欄位隨寬度長出來。
 */
export function WritingTable({ writings }: { writings: Writing[] }) {
  const router = useRouter();

  return (
    <div className="rounded-surface min-h-0 w-full flex-1 overflow-y-auto border bg-white">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-table-header-bg sticky top-0 z-10 text-left [&_th]:shadow-[inset_0_-1px_0_var(--color-table-header-rule)]">
          <tr>
            <th className="w-[26%] px-3 py-2 whitespace-nowrap sm:w-[16%]">日期</th>
            <th className="w-[74%] px-3 py-2 whitespace-nowrap sm:w-[38%]">標題</th>
            <th className="hidden px-3 py-2 whitespace-nowrap sm:table-cell sm:w-[14%]">類型</th>
            <th className="hidden px-3 py-2 whitespace-nowrap lg:table-cell lg:w-[16%]">關鍵字</th>
            <th className="hidden px-3 py-2 whitespace-nowrap xl:table-cell xl:w-[16%]">延伸自</th>
          </tr>
        </thead>
        <tbody>
          {writings.map((e) => (
            <tr
              key={e.id}
              onClick={() => router.push(writingEditHref(e.id))}
              className="cursor-pointer border-t hover:bg-gray-50"
            >
              <td className="px-3 py-2 whitespace-nowrap tabular-nums">{e.date || "—"}</td>
              {/* max-w-0 + overflow-hidden：table-fixed 下過長的標題會擠進隔壁欄，寧可切掉 */}
              <td className="max-w-0 overflow-hidden px-3 py-2">
                <span className="block overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                  {e.title || "（沒有標題）"}
                </span>
              </td>
              <td className="hidden max-w-0 overflow-hidden px-3 py-2 sm:table-cell">
                <TagList values={splitTags(e.kind)} tone="article" wrap={false} />
              </td>
              <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                <TagList values={splitTags(e.keywords)} tone="domain" wrap={false} />
              </td>
              <td className="hidden max-w-0 overflow-hidden px-3 py-2 xl:table-cell">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-gray-500">
                  {e.sourceTitle}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { writingEditHref } from "@/config/routes";
import { KeywordTag } from "@/features/keywords/components/keyword-tag";
import { splitLines, splitTags } from "@/types/book";
import { Writing } from "@/types/writing";
import { tagColorClass } from "@/utils/tag-colors";

/**
 * 書寫的表格檢視：一列一則，只放標題那一行。
 *
 * 內文刻意不進表格——紀事的內文長短差很多，塞進格子裡不是被截斷就是把列撐高，
 * 兩種都讓「這陣子寫了什麼」變得難掃。要看內容點進去就好，表格負責找到那一則。
 *
 * 欄位由左到右是「這是什麼 → 叫什麼 → 關於什麼 → 從哪來 → 什麼時候」。
 * 日期擺最右邊：它是查證用的，不是掃描時在找的東西。
 *
 * 窄螢幕不再藏欄位，改成整張表左右滑——藏起來的欄位在手機上等於不存在，
 * 而「這則是什麼類型」正是手機上最想先看到的。
 */
/** 類型與關鍵字的長相跟時間軸那邊同一套：同一個東西在兩個檢視裡不該換臉 */
const styles = {
  kind: "rounded-control shrink-0 px-1 py-px text-[10px] leading-none font-medium",
  tag: "rounded-control shrink-0 bg-gray-100 px-1 py-px text-[10px] text-gray-500 hover:bg-gray-200",
};

export function WritingTable({ writings }: { writings: Writing[] }) {
  const router = useRouter();

  return (
    <div className="rounded-surface min-h-0 w-full flex-1 overflow-auto border bg-white">
      {/* min-w 撐出橫向捲軸：窄螢幕滑著看，寬螢幕照百分比分配 */}
      <table className="w-full min-w-[40rem] table-fixed text-sm">
        <thead className="bg-table-header-bg sticky top-0 z-10 text-left [&_th]:shadow-[inset_0_-1px_0_var(--color-table-header-rule)]">
          <tr>
            <th className="w-[14%] px-3 py-2 whitespace-nowrap">類型</th>
            <th className="w-[34%] px-3 py-2 whitespace-nowrap">標題</th>
            <th className="w-[22%] px-3 py-2 whitespace-nowrap">關鍵字</th>
            <th className="w-[20%] px-3 py-2 whitespace-nowrap">延伸自</th>
            <th className="w-[10%] px-3 py-2 whitespace-nowrap">日期</th>
          </tr>
        </thead>
        <tbody>
          {writings.map((e) => (
            <tr
              key={e.id}
              onClick={() => router.push(writingEditHref(e.id))}
              className="cursor-pointer border-t hover:bg-gray-50"
            >
              <td className="max-w-0 overflow-hidden px-3 py-2">
                <div className="flex flex-nowrap gap-1.5">
                  {splitTags(e.kind).map((kind) => (
                    <span key={kind} className={`${styles.kind} ${tagColorClass(kind, [])}`}>
                      {kind}
                    </span>
                  ))}
                </div>
              </td>
              {/* max-w-0 + overflow-hidden：table-fixed 下過長的標題會擠進隔壁欄，寧可切掉 */}
              <td className="max-w-0 overflow-hidden px-3 py-2">
                <span className="block overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                  {e.title || "（沒有標題）"}
                </span>
              </td>
              {/* 關鍵字是一行一個，不是頓號分隔——splitTags 會把整段當成一個標籤 */}
              <td className="max-w-0 overflow-hidden px-3 py-2">
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="flex flex-nowrap gap-1"
                >
                  {splitLines(e.keywords).map((name) => (
                    <KeywordTag key={name} name={name} className={styles.tag} />
                  ))}
                </div>
              </td>
              <td className="max-w-0 overflow-hidden px-3 py-2">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-gray-500">
                  {e.sourceTitle}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap tabular-nums">{e.date || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

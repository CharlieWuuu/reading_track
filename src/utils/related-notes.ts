import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";

/**
 * 每個詳細頁底下的「相關筆記」：書寫表裡指到這個東西的那幾則。
 *
 * 反查的鍵各自不同（書用編號、關鍵字用詞），但「挑出來、由新到舊排」是同一件事，
 * 所以分成兩支挑選函式加一支排序，畫面那邊只吃排好的陣列。
 */

/** 由新到舊；沒有日期的排最後（它們多半是還沒整理的舊資料） */
function byNewest(a: Writing, b: Writing): number {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return b.date.localeCompare(a.date);
}

/**
 * 「延伸自」指到這幾個編號的紀事。
 *
 * 收的是一組編號不是單一個：同一本書讀兩次是兩列、兩個編號，
 * 但對讀的人是同一本書，兩次的心得要一起看得到。
 */
export function notesForSource(writings: Writing[], sourceIds: Iterable<string>): Writing[] {
  const ids = new Set([...sourceIds].filter(Boolean));
  if (ids.size === 0) return [];
  return writings.filter((w) => w.sourceId && ids.has(w.sourceId)).sort(byNewest);
}

/** 關鍵字欄含這個詞的紀事。關鍵字是一行一個，不是頓號分隔 */
export function notesForKeyword(writings: Writing[], name: string): Writing[] {
  const keyword = name.trim();
  if (!keyword) return [];
  return writings.filter((w) => splitLines(w.keywords).includes(keyword)).sort(byNewest);
}

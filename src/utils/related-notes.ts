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
  if (!a.endDate) return 1;
  if (!b.endDate) return -1;
  return b.endDate.localeCompare(a.endDate);
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

/**
 * 照類型分組，組內維持原本的排序。
 *
 * 詳情頁底下那一區本來掛一條寫死的「心得・紀事」，但那幾則各有各的類型
 * （心得、思緒、週計劃…），思緒掛在寫著「心得」的標題底下對不起來。
 * 類型名使用者改得掉，所以標題從資料來，不寫死。
 */
export function notesByKind(notes: Writing[]): { kindName: string; notes: Writing[] }[] {
  return notes.reduce<{ kindName: string; notes: Writing[] }[]>((groups, note) => {
    const name = note.kindName || "紀事";
    const found = groups.find((g) => g.kindName === name);
    if (found) return groups.map((g) => (g === found ? { ...g, notes: [...g.notes, note] } : g));
    return [...groups, { kindName: name, notes: [note] }];
  }, []);
}

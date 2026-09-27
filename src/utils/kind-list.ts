import { RecordStatus } from "@/types/book";
import { byDateThenNewest } from "./record-order";

/**
 * 類型頁清單的整形：分段、狀態、頁首數字、完成編號。純函式，不查資料。
 *
 * 本來散在書籍專屬頁（byYear、completionNumbers、bookMeta），只有書籍有；
 * 搬到這裡，任何類型照 setting_kinds 的設定都能用。
 */

export type PeriodGroup<T> = { label: string; items: T[] };

type Dated = { endDate?: string | null };

const yearOf = (date: string): string => date.slice(0, 4);

/** 照完成年分段，新的在前。沒完成日的另成一段放最後——還沒完成，沒有時間可排 */
export function byYear<T extends Dated>(
  items: readonly T[],
  undatedLabel: string,
): PeriodGroup<T>[] {
  const dated = items.filter((item) => item.endDate);
  const undated = items.filter((item) => !item.endDate);
  const labels = [...new Set(dated.map((item) => yearOf(item.endDate!)))].sort((a, b) =>
    b.localeCompare(a),
  );
  const groups = labels.map((label) => ({
    label,
    items: dated.filter((item) => yearOf(item.endDate!) === label),
  }));
  return undated.length > 0 ? [...groups, { label: undatedLabel, items: undated }] : groups;
}

/** 頁首那行小字：「128 本」，算重讀又真的有重讀時寫「133 次・128 本」 */
export function countMeta(
  rows: readonly { workId?: string | null }[],
  unit: string,
  countRereads: boolean,
): string {
  if (!countRereads) return `${rows.length} ${unit}`;
  const works = new Set(rows.map((row) => row.workId)).size;
  return rows.length === works ? `${works} ${unit}` : `${rows.length} 次・${works} ${unit}`;
}

/** 完成的依序編號：最早完成的是 1，最新的最大。沒完成的沒有號碼——還沒排得進順序 */
export function doneNumbers(rows: readonly ({ id: string } & Dated)[]): Map<string, number> {
  const done = rows
    .filter((row) => row.endDate)
    .sort((a, b) => a.endDate!.localeCompare(b.endDate!));
  return new Map(done.map((row, index) => [row.id, index + 1]));
}

export type Status = "reading" | "want" | "done";

type StatusDates = { startDate?: string | null; endDate?: string | null };

/** 沒查到類型時當作兩個日期都有勾：跟原本只看日期的判斷一樣 */
const BOTH_DATES: ReadonlySet<string> = new Set(["startDate", "endDate"]);

/**
 * 一筆紀錄的狀態，照類型勾了哪些日期判斷，不只看資料庫裡有沒有值。
 *
 * 類型沒勾開始日期，就沒有「進行中」：舊資料留著的開始日期不算數，
 * 不然文章拿掉開始日期之後，概覽還是冒出一排「進行中」。
 * 兩個日期都沒勾的類型沒有時間可判斷，記下就算完成。
 */
export function statusOf(row: StatusDates, moduleKeys: ReadonlySet<string> = BOTH_DATES): Status {
  const hasStart = moduleKeys.has("startDate");
  const hasEnd = moduleKeys.has("endDate");
  if (!hasStart && !hasEnd) return "done";
  if (hasEnd && row.endDate) return "done";
  if (hasStart && row.startDate) return "reading";
  return "want";
}

/** 每個類型勾了哪些模組，照 kindId 查。混排多種類型的頁面用它判斷每一筆的狀態 */
export const moduleKeysByKind = (
  kinds: readonly { id: string; modules: readonly { key: string }[] }[],
): Map<string, ReadonlySet<string>> =>
  new Map(kinds.map((kind) => [kind.id, new Set(kind.modules.map((module) => module.key))]));

/** 紀錄照狀態拆三份：進行中進頭條與右欄、想要只進右欄、完成照時間排 */
export function splitByStatus<T extends StatusDates & { kindId: string }>(
  rows: readonly T[],
  keysByKind: ReadonlyMap<string, ReadonlySet<string>>,
) {
  const status = (row: T) => statusOf(row, keysByKind.get(row.kindId));
  return {
    active: rows.filter((row) => status(row) === "reading"),
    pending: rows.filter((row) => status(row) === "want"),
    done: rows.filter((row) => status(row) === "done"),
  };
}

type Dates = { startDate?: string | null; endDate?: string | null; createdAt?: string };

/**
 * 紀錄從新到舊：完成的看完成日、還在進行的看開始日，同一天再看誰先記。
 * 資料庫照建立時間由舊到新給，那是寫入的順序，不是讀者要的順序。
 */
export const recordsNewestFirst = <T extends Dates>(rows: readonly T[]): T[] =>
  [...rows].sort(byDateThenNewest((row) => row.endDate ?? row.startDate ?? null));

/** 片段從新到舊：看它自己填的日期，不是建立時間——補記一則舊的該落在它自己的日期上 */
export const fragmentsNewestFirst = <T extends { date: string | null; createdAt?: string }>(
  rows: readonly T[],
): T[] => [...rows].sort(byDateThenNewest((row) => row.date));

/** 狀態對到畫面上的字與點的顏色（STATUS_DOTS 用這組字當 key） */
export const STATUS_LABEL: Record<Status, RecordStatus> = {
  reading: "進行",
  want: "想要",
  done: "完成",
};

/** 書封格底下那行：完成的寫完成日，沒完成的寫狀態 */
export const tileMeta = (endDate: string | null | undefined, status: Status): string =>
  endDate && status === "done" ? `${endDate} 完成` : STATUS_LABEL[status];

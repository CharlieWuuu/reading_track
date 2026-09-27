import { CardGroupBy } from "@/config/kind-display";

/**
 * 類型頁清單的整形：分段、狀態、頁首數字、完成編號。純函式，不查資料。
 *
 * 本來散在書籍專屬頁（byYear、completionNumbers、bookMeta），只有書籍有；
 * 搬到這裡，任何類型照 setting_kinds 的設定都能用。
 */

export type PeriodGroup<T> = { label: string; items: T[] };

type Dated = { endDate?: string | null };

const periodOf = (date: string, by: CardGroupBy): string =>
  by === "year" ? date.slice(0, 4) : `${date.slice(0, 4)} · ${date.slice(5, 7)}`;

/** 照完成日分段，新的在前。沒完成日的另成一段放最後——還沒完成，沒有時間可排 */
export function byPeriod<T extends Dated>(
  items: readonly T[],
  by: CardGroupBy,
  undatedLabel: string,
): PeriodGroup<T>[] {
  const dated = items.filter((item) => item.endDate);
  const undated = items.filter((item) => !item.endDate);
  const labels = [...new Set(dated.map((item) => periodOf(item.endDate!, by)))].sort((a, b) =>
    b.localeCompare(a),
  );
  const groups = labels.map((label) => ({
    label,
    items: dated.filter((item) => periodOf(item.endDate!, by) === label),
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

type WithStatus = { statusKey: string };

/** 紀錄照狀態拆三份：進行中進頭條與右欄、想要只進右欄、完成照時間排 */
export function splitByStatus<T extends WithStatus>(rows: readonly T[]) {
  return {
    active: rows.filter((row) => row.statusKey === "reading"),
    pending: rows.filter((row) => row.statusKey === "want"),
    done: rows.filter((row) => row.statusKey === "done"),
  };
}

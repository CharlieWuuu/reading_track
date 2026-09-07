/**
 * 清單的排序。
 *
 * 日期欄只到日，同一天記的幾筆日期完全相同——本來退回去比標題，於是同一天
 * 的順序看起來是亂的（其實是字典序）。改成比 `createdAt`：記得晚的排前面，
 * 跟人的直覺一致。書籍與文章日期欄不同（書有起訖），所以取哪個欄位由呼叫端給。
 */
export function byDateThenNewest<T extends { createdAt?: string }>(
  dateOf: (record: T) => string | null,
) {
  return (a: T, b: T): number => {
    // 沒填日期的自然排到最後：空字串在遞減比較裡最小
    const aDate = dateOf(a) ?? "";
    const bDate = dateOf(b) ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    // 本機快取可能是加 createdAt 之前存的，那時的資料沒有這一欄
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  };
}

import { RecordRow } from "@/lib/db/queries/catalog";

/**
 * 自己標私人的那幾筆濾掉——書籍那種「整個分類標私人」的規則需要另外 join
 * 主題樹，這條路徑的 RecordRow 還沒接那份資料，先只擋「自己標私人」這一半。
 */
export function hideSelfPrivate(rows: RecordRow[]): RecordRow[] {
  return rows.filter((row) => !row.isPrivate);
}

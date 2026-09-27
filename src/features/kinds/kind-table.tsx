import Link from "next/link";
import { kindHref } from "@/config/kind-routes";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { Kind } from "@/lib/db/queries/kinds";
import { doneNumbers } from "@/utils/kind-list";
import { cellOf, tableColumns } from "@/utils/kind-table";
import { fragmentHref } from "@/utils/overview-items";

/**
 * 表格：一列一筆，欄位照類型勾的模組。掃描與比較用，跟概覽的「摘要」是兩種目的。
 *
 * 本來書籍、文章、單字各有一支寫死欄位的表格，自訂類型沒有表格可看。
 * 標題那格點進詳情；要改就從詳情進編輯，表格不做行內編輯。
 */

const styles = {
  wrap: "overflow-x-auto pb-10", // 欄位多時橫向捲；PageBody 自己捲，底部留白在內容尾端
  table: "w-full border-collapse text-left",
  th: "text-label text-ink-faint border-rule-strong border-b-2 px-2 pb-2 font-medium whitespace-nowrap",
  td: "border-rule text-ui text-ink-muted border-b px-2 py-2.5 align-top",
  title: "font-serif text-item-sm text-ink font-semibold hover:underline",
  number: "text-meta text-ink-faint tabular-nums",
};

type Row = { id: string; href: string; endDate?: string | null; source: RecordRow | FragmentRow };

const rowsOf = (kind: Kind, records: RecordRow[], fragments: FragmentRow[]): Row[] =>
  kind.group === "records"
    ? records.map((row) => ({
        id: row.id,
        href: `${kindHref(kind.group, kind.slug)}/${row.id}`,
        endDate: row.endDate,
        source: row,
      }))
    : fragments.map((row) => ({
        id: row.id,
        href: fragmentHref(row),
        endDate: row.date,
        source: row,
      }));

export function KindTable({
  kind,
  records,
  fragments,
}: {
  kind: Kind;
  records: RecordRow[];
  fragments: FragmentRow[];
}) {
  const rows = rowsOf(kind, records, fragments);
  const columns = tableColumns(kind.modules);
  const numbers = kind.numberDone ? doneNumbers(rows) : new Map<string, number>();

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {kind.numberDone && <th className={styles.th}>#</th>}
            {columns.map((column) => (
              <th key={column.key} className={styles.th}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {kind.numberDone && (
                <td className={`${styles.td} ${styles.number}`}>{numbers.get(row.id) ?? ""}</td>
              )}
              {columns.map((column) => (
                <td key={column.key} className={styles.td}>
                  {column.key === "title" ? (
                    <Link href={row.href} className={styles.title}>
                      {cellOf(row.source, "title") || "（沒有標題）"}
                    </Link>
                  ) : (
                    cellOf(row.source, column.key)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

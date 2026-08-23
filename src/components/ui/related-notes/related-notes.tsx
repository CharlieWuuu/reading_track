import Link from "next/link";
import { writingHref } from "@/config/routes";
import { Writing } from "@/types/writing";
import { shortDate } from "@/utils/date";

const styles = {
  list: "divide-rule-soft flex flex-col divide-y",
  row: "flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 hover:bg-gray-50",
  head: "flex min-w-0 items-baseline gap-2",
  title: "min-w-0 truncate text-sm font-medium",
  meta: "ml-auto shrink-0 text-[11px] text-gray-400 tabular-nums",
  note: "line-clamp-2 text-xs leading-relaxed text-gray-500",
  empty: "text-xs text-gray-400",
};

/**
 * 這一頁底下的相關筆記：書寫表裡指到它的那幾則。
 *
 * 只吃排好的陣列——「哪些算相關」每一種頁面的答案都不一樣（書用編號、
 * 關鍵字用詞），那是 utils/related-notes 的事，這裡只管長相。
 *
 * 內文截兩行：要看完點進去，這一段的作用是「想起來那則在講什麼」。
 */
export function RelatedNotes({
  notes,
  empty = "還沒有相關的紀事",
}: {
  notes: Writing[];
  empty?: string;
}) {
  if (notes.length === 0) return <p className={styles.empty}>{empty}</p>;

  return (
    <div className={styles.list}>
      {notes.map((note) => (
        <Link key={note.id} href={writingHref(note.id)} className={styles.row}>
          <span className={styles.head}>
            <span className={styles.title}>{note.title || "（沒有標題）"}</span>
            {note.kind && <span className="shrink-0 text-[11px] text-gray-400">{note.kind}</span>}
            <span className={styles.meta}>{shortDate(note.date)}</span>
          </span>
          {note.note.trim() && <span className={styles.note}>{note.note}</span>}
        </Link>
      ))}
    </div>
  );
}

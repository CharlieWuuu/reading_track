/**
 * 一句佳句的版式。全站只有這一份。
 *
 * 照書裡的樣子排：開頭一個引號、襯線字，出處靠右加破折號當署名。
 * 引號用 ldquo 掛在文字左上角，不佔行首那一格——中文標點本來就有半格空白，
 * 再縮排一次會歪掉。
 *
 * 不畫左側那條線：清單裡旁邊常有封面，兩個直的元素並排會像被切成兩欄。
 *
 * 吃的是已經接好的字串，不綁資料形狀——佳句在片段表與紀錄表各有一種列，
 * 誰的欄位叫什麼由呼叫端自己轉。出處與想法沒給就不畫，詳情頁底下另有欄位區。
 */

const styles = {
  wrap: "flex flex-col gap-1.5",
  text: "relative pl-6 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base",
  mark: "absolute top-0 left-0 font-serif text-3xl leading-none text-gray-300 select-none",
  source: "text-meta text-ink-faint truncate pl-4 text-right",
  note: "text-meta text-ink-faint leading-relaxed whitespace-pre-wrap",
};

export function Quote({ text, source, note }: { text: string; source?: string; note?: string }) {
  return (
    <div className={styles.wrap}>
      <blockquote className={styles.text}>
        <span aria-hidden className={styles.mark}>
          &ldquo;
        </span>
        {text}
      </blockquote>
      {source && <p className={styles.source}>— {source}</p>}
      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}

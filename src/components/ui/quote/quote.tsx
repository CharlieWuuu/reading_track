/**
 * 一句佳句的版式。全站只有這一份。
 *
 * 照書裡的樣子排：前後一對引號、襯線字，出處靠右加破折號當署名（兩個全形寬）。
 * 上引號絕對定位掛在文字左上角，不佔行首那一格——中文標點本來就有半格空白，
 * 再縮排一次會歪掉。下引號跟著最後一個字走，只能是行內元素。
 *
 * 不畫左側那條線：清單裡旁邊常有封面，兩個直的元素並排會像被切成兩欄。
 *
 * 吃的是已經接好的字串，不綁資料形狀——佳句在片段表與紀錄表各有一種列，
 * 誰的欄位叫什麼由呼叫端自己轉。出處與想法沒給就不畫，詳情頁底下另有欄位區。
 */

const styles = {
  wrap: "flex flex-col gap-1.5",
  text: "relative pl-5 font-serif text-[15px] leading-relaxed text-gray-800 md:text-base",
  body: "whitespace-pre-wrap",
  // 掛在第一行的高度上，不是整塊的頂——top-0 配大字級會浮在文字上面一行
  markStart:
    "absolute top-[0.15em] left-[-0.2em] font-serif text-2xl leading-none text-gray-300 select-none",
  // 下引號接在最後一個字後面，不能絕對定位——句子多長它就在哪。
  // h-[1em] + inline-block：引號字級比內文大，不歸零高度會把那一行的行高撐開；
  // 高度歸零後用 relative 微調到跟上引號同一條線（兩者都是 top-[0.15em]）
  markEnd:
    "relative top-[0.15em] ml-0.5 inline-block h-[1em] font-serif text-2xl leading-none text-gray-300 select-none",
  source: "text-meta text-ink-faint truncate pl-4 text-right",
  note: "text-meta text-ink-faint leading-relaxed whitespace-pre-wrap",
};

export function Quote({ text, source, note }: { text: string; source?: string; note?: string }) {
  return (
    <div className={styles.wrap}>
      <blockquote className={styles.text}>
        <span aria-hidden className={styles.markStart}>
          &ldquo;
        </span>
        {/* 內文自己一層：pre-wrap 只能套在內文上，套在外層會把 JSX 的縮排也印出來 */}
        <span className={styles.body}>{text}</span>
        <span aria-hidden className={styles.markEnd}>
          &rdquo;
        </span>
      </blockquote>
      {source && <p className={styles.source}>—— {source}</p>}
      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}

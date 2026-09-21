/**
 * 一句佳句的版式，全站只有這一份。吃接好的字串，不綁資料形狀。
 *
 * 不畫左側那條線：旁邊常有封面，兩個直的元素並排像被切成兩欄。
 */

const styles = {
  wrap: "flex flex-col gap-1.5",
  text: "relative pl-5 font-serif text-[15px] leading-relaxed text-gray-800 md:text-base",
  body: "whitespace-pre-wrap",
  // 掛在第一行的高度上，不是整塊的頂——top-0 會浮到文字上面一行
  markStart:
    "absolute top-[0.15em] left-[-0.2em] font-serif text-2xl leading-none text-gray-300 select-none",
  // 跟著最後一個字走，只能是行內元素。h-[1em] 歸零高度，不然會撐開那行的行高
  markEnd:
    "relative top-[0.15em] ml-0.5 inline-block h-[1em] font-serif text-2xl leading-none text-gray-300 select-none",
  source: "text-meta text-ink-faint truncate pl-4 text-right",
};

export function Quote({ text, source }: { text: string; source?: string }) {
  return (
    <div className={styles.wrap}>
      <blockquote className={styles.text}>
        <span aria-hidden className={styles.markStart}>
          &ldquo;
        </span>
        {/* 內文自己一層：pre-wrap 套在外層會把 JSX 的縮排也印出來 */}
        <span className={styles.body}>{text}</span>
        <span aria-hidden className={styles.markEnd}>
          &rdquo;
        </span>
      </blockquote>
      {source && <p className={styles.source}>—— {source}</p>}
    </div>
  );
}

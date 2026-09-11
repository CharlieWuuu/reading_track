import { QuoteRow, VocabularyRow } from "@/types/record";

/**
 * 佳句、心得、單字的版式：書籍資訊頁與筆記頁共用同一份，
 * 兩邊看到的同一則東西才會長得一樣，只差筆記頁左邊多一張封面。
 */

/** 佳句照書裡的樣子排：出處靠右當署名，心得再下一行 */
export function QuoteBlock({ quote }: { quote: Pick<QuoteRow, "text" | "chapter" | "note"> }) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* 不畫左側那條線：旁邊就是封面，兩個直的元素並排會像被切成兩欄 */}
      <blockquote className="font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base">
        {quote.text}
      </blockquote>
      {quote.chapter && <p className="text-xs text-gray-400">{quote.chapter}</p>}
      {quote.note && (
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-400">{quote.note}</p>
      )}
    </div>
  );
}

/** 單字排成一行：單字靠左、翻譯靠右，同一行一目了然 */
export function VocabularyItem({ row }: { row: VocabularyRow }) {
  return (
    <li className="flex items-baseline justify-between gap-2 py-1.5">
      <span className="font-serif text-sm font-medium text-gray-900">{row.word}</span>
      {row.wordTranslation && (
        <span className="shrink-0 text-xs text-gray-400">{row.wordTranslation}</span>
      )}
    </li>
  );
}

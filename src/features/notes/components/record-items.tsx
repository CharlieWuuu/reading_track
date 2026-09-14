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
      <blockquote className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base">
        {quote.text}
      </blockquote>
      {quote.chapter && <p className="text-right text-xs text-gray-400">— {quote.chapter}</p>}
      {quote.note && (
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-400">{quote.note}</p>
      )}
    </div>
  );
}

/** 單字排成詞條：單字與翻譯同一行，例句與翻譯縮排在下面 */
export function VocabularyItem({ row }: { row: VocabularyRow }) {
  return (
    <li className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-baseline gap-2">
        {/* 單字是這一則的主角，比翻譯與例句大一級 */}
        <span className="text-base font-semibold text-gray-900 md:text-lg">{row.word}</span>
        {row.pronunciation && <span className="text-xs text-gray-400">{row.pronunciation}</span>}
        {row.wordTranslation && (
          <span className="text-sm text-gray-500">{row.wordTranslation}</span>
        )}
        {row.chapter && <span className="text-xs text-gray-400">{row.chapter}</span>}
      </p>
      {row.sentence && (
        <p className="pl-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-600">
          {row.sentence}
        </p>
      )}
      {row.sentenceTranslation && (
        <p className="pl-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-400">
          {row.sentenceTranslation}
        </p>
      )}
    </li>
  );
}

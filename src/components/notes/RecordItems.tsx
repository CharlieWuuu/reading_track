import { QuoteRow, VocabularyRow } from "@/types/record";

/**
 * 佳句、心得、單字的版式：書籍資訊頁與筆記頁共用同一份，
 * 兩邊看到的同一則東西才會長得一樣，只差筆記頁左邊多一張封面。
 */

/** 佳句照書裡的樣子排：引文用襯線字並縮排，出處靠右當署名，心得再下一行 */
export function QuoteBlock({ quote }: { quote: Pick<QuoteRow, "text" | "chapter" | "note"> }) {
  return (
    <div className="flex flex-col gap-1.5">
      <blockquote className="border-l-2 border-gray-300 pl-4 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 md:text-base">
        {quote.text}
      </blockquote>
      {quote.chapter && <p className="pl-4 text-right text-xs text-gray-400">— {quote.chapter}</p>}
      {quote.note && (
        <p className="pl-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-400">
          {quote.note}
        </p>
      )}
    </div>
  );
}

/** 心得是長文，用襯線字與寬行距，看起來就是一段文章 */
export function NoteBlock({ note }: { note: string }) {
  return (
    <p className="max-w-3xl font-serif text-[15px] leading-[1.9] whitespace-pre-wrap text-gray-800 md:text-base">
      {note}
    </p>
  );
}

/** 單字排成詞條：單字與翻譯同一行，例句與翻譯縮排在下面 */
export function VocabularyItem({ row }: { row: VocabularyRow }) {
  return (
    <li className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium text-gray-900">{row.word}</span>
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

import { ComponentType } from "react";
import { ArticleDetailView } from "@/features/articles/components/article-detail-view";
import { BookDetailView } from "@/features/books/components/book-detail-view";
import { KeywordDetailView } from "@/features/keywords/components/keyword-detail-view";
import { KeywordEditView } from "@/features/keywords/components/keyword-edit-view";
import { QuoteDetailView } from "@/features/notes/components/quote-detail-view";
import { VocabularyDetailView } from "@/features/notes/components/vocabulary-detail-view";
import { VocabularyEditView } from "@/features/notes/components/vocabulary-edit-view";
import { WritingDetailView } from "@/features/writing/components/writing-detail-view";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 內建類型的專屬呈現，用 slug 對照。
 *
 * 沒有列在這裡的（含所有自訂類型）用通用表單——不是每種都要換皮，
 * 通用那套已經夠用的就不必自己寫一份。清單一律通用，沒有例外。
 *
 * recordId 那一段代表什麼由類型自己解讀：大部分是編號，單字與關鍵字是
 * 「詞」本身——同一個詞在不同書各有一列，那一頁要一次列完，用編號就拆散了。
 */
export type KindVariant = {
  /** 詳情只收網址上那一段：專屬元件自己撈資料，不需要 kind，書寫那條路也根本沒有對應的 kind */
  detail?: ComponentType<{ recordId: string }>;
  /**
   * 整頁的編輯畫面，跟 form 不同：form 是嵌在通用編輯頁裡的表單，通用頁會先拿
   * recordId 去查 catalog；單字與關鍵字的那一段是「詞」不是編號，查不到，
   * 所以整頁自己畫、自己撈。
   */
  edit?: ComponentType<{ recordId: string }>;
  form?: ComponentType<{ kind: Kind; recordId?: string; initial?: Record<string, string> }>;
};

const REGISTRY: Record<string, KindVariant> = {
  books: { detail: BookDetailView },
  articles: { detail: ArticleDetailView },
  quotes: { detail: QuoteDetailView },
  vocabulary: { detail: VocabularyDetailView, edit: VocabularyEditView },
  keywords: { detail: KeywordDetailView, edit: KeywordEditView },
  writing: { detail: WritingDetailView },
};

export const variantFor = (slug: string): KindVariant => REGISTRY[slug] ?? {};

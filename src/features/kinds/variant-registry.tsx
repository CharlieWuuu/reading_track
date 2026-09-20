import { ComponentType } from "react";
import { ArticleDetailView } from "@/features/articles/components/article-detail-view";
import { BookDetailView } from "@/features/books/components/book-detail-view";
import { WritingDetailView } from "@/features/writing/components/writing-detail-view";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 還沒通用化的那幾種，用 slug 對照。
 *
 * 沒有列在這裡的（含所有自訂類型）用通用表單——勾了哪些模組就畫哪幾格，
 * 設定頁說了算。
 *
 * 佳句、單字、關鍵字本來在這裡，那幾支是手寫的 JSX：七格寫死的輸入框，
 * 完全不讀 setting_map_kind_field。使用者在設定頁改模組，那三頁一格都不會變，
 * 「內部連結」「私人」這種每個類型都有的也畫不出來。拆掉了。
 *
 * 當初的理由是「recordId 是詞不是編號，通用頁查不到」。現在通用頁兩種都接得住
 * （見 useRecordId）：是編號就直接用，是名字就去那個類型裡找同名的第一筆。
 */
export type KindVariant = {
  /** 詳情只收網址上那一段：專屬元件自己撈資料，書寫那條路根本沒有對應的 kind */
  detail?: ComponentType<{ recordId: string }>;
  /** 整頁的編輯畫面。目前沒有人用——通用編輯頁照模組畫，設定改了畫面就跟著改 */
  edit?: ComponentType<{ recordId: string }>;
  form?: ComponentType<{ kind: Kind; recordId?: string; initial?: Record<string, string> }>;
};

const REGISTRY: Record<string, KindVariant> = {
  books: { detail: BookDetailView },
  articles: { detail: ArticleDetailView },
  writing: { detail: WritingDetailView },
};

export const variantFor = (slug: string): KindVariant => REGISTRY[slug] ?? {};

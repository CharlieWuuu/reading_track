/** 補齊來源。設定頁勾選、範本預設、表單按鈕都讀這一份；查詢實作在 lib/autofill */
export const AUTOFILL_SOURCES = [
  { slug: "books", label: "書籍資料庫" },
  { slug: "wikipedia", label: "維基百科" },
] as const;

export type AutofillSlug = (typeof AUTOFILL_SOURCES)[number]["slug"];

const KNOWN = new Set<string>(AUTOFILL_SOURCES.map((s) => s.slug));

/** 資料庫存的是任意字串，濾掉已下架的來源 */
export const knownSources = (slugs: readonly string[]): AutofillSlug[] =>
  slugs.filter((slug): slug is AutofillSlug => KNOWN.has(slug));

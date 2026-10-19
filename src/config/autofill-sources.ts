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

/** 欄位存逗號相接的字串，跟 views 同一套 */
export const toAutofillSources = (value: string): AutofillSlug[] =>
  knownSources(value.split(",").map((s) => s.trim()));

/** API 收到的任意值：不是陣列就當沒勾，認不得的來源丟掉 */
export const parseAutofill = (value: unknown): AutofillSlug[] =>
  Array.isArray(value) ? knownSources(value.filter((v): v is string => typeof v === "string")) : [];

export const fromAutofillSources = (slugs: readonly string[]): string =>
  knownSources(slugs).join(",");

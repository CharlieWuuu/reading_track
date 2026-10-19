/**
 * 補齊來源。設定頁勾選、範本預設、表單按鈕都讀這一份；查詢實作在 lib/autofill。
 *
 * 順序就是查詢順序，第一個查到的為止：先問給得出頁數與字數的書店，
 * 英文書、字典與百科殿後。label 是使用者看到的名字，不放網址。
 */
export const AUTOFILL_SOURCES = [
  { slug: "taaze", label: "讀冊生活" },
  { slug: "pubu", label: "Pubu 電子書城" },
  { slug: "readmoo", label: "讀墨" },
  { slug: "google-books", label: "Google 圖書" },
  { slug: "open-library", label: "Open Library 開放圖書館" },
  { slug: "moedict", label: "萌典" },
  { slug: "wiktionary", label: "維基詞典" },
  { slug: "wikipedia", label: "維基百科" },
] as const;

export type AutofillSlug = (typeof AUTOFILL_SOURCES)[number]["slug"];

const KNOWN = new Set<string>(AUTOFILL_SOURCES.map((s) => s.slug));
const ORDER = new Map<string, number>(AUTOFILL_SOURCES.map((s, i) => [s.slug, i]));

/** 資料庫存的是任意字串，濾掉已下架的來源；一律照來源表的順序排 */
export const knownSources = (slugs: readonly string[]): AutofillSlug[] =>
  slugs
    .filter((slug): slug is AutofillSlug => KNOWN.has(slug))
    .sort((a, b) => (ORDER.get(a) ?? 0) - (ORDER.get(b) ?? 0));

/** 欄位存逗號相接的字串，跟 views 同一套 */
export const toAutofillSources = (value: string): AutofillSlug[] =>
  knownSources(value.split(",").map((s) => s.trim()));

/** API 收到的任意值：不是陣列就當沒勾，認不得的來源丟掉 */
export const parseAutofill = (value: unknown): AutofillSlug[] =>
  Array.isArray(value) ? knownSources(value.filter((v): v is string => typeof v === "string")) : [];

export const fromAutofillSources = (slugs: readonly string[]): string =>
  knownSources(slugs).join(",");

export const ALL_AUTOFILL_SOURCES: AutofillSlug[] = AUTOFILL_SOURCES.map((s) => s.slug);

/** 範本預設：書籍問書店與圖書館，單字問字典 */
export const BOOK_AUTOFILL_SOURCES: AutofillSlug[] = [
  "taaze",
  "pubu",
  "readmoo",
  "google-books",
  "open-library",
];
export const DICTIONARY_AUTOFILL_SOURCES: AutofillSlug[] = ["moedict", "wiktionary"];

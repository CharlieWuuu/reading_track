import { Article } from "@/types/article";
import { Book } from "@/types/book";
import { JournalEntry } from "@/types/journal";
import { Metric } from "@/types/metric";

export type BookField = keyof Book;
export type ArticleField = keyof Article;
export type JournalField = keyof JournalEntry;
export type MetricField = keyof Metric;

/**
 * 一個分頁的欄位定義。書籍、文章各有一份，共同欄位從 COMMON_* 繼承。
 *
 * 刻意讓每種媒介各自一張表：Sheet 同時是使用者的後台編輯器，
 * 把書和文章擠進同一張表會多出一堆對不上的空格，人就讀不下去了。
 * 「兩種紀錄合成一條時間軸」是程式的事，在讀完之後 merge，不是表的事。
 */
export interface TableSpec<F extends string, L extends F = never> {
  /** 分頁名稱。找不到時才建新的，所以改名要走 titleAliases，不能直接換掉 */
  title: string;
  /**
   * 也認得的舊分頁名。
   *
   * 分頁改名之後如果程式只認新名字，它會以為表不存在、另外開一張空的，
   * 資料就孤在舊分頁上了——所以改名一定要把舊名留在這裡。
   */
  titleAliases?: string[];
  /** 全部欄位，順序就是新建分頁時的表頭順序 */
  fields: F[];
  /** 哪個欄位是主鍵。通用的讀寫要靠它認列，各表都是 UUID */
  idField: F;
  /** 讀得到但 app 不再寫入的欄位 */
  legacy: L[];
  labels: Record<F, string>;
  aliases: Record<F, string[]>;
}

/** app 會維護的欄位：缺了就補、寫入時一定填 */
export function managedFields<F extends string, L extends F>(
  spec: TableSpec<F, L>,
): Exclude<F, L>[] {
  const legacy = spec.legacy as string[];
  return spec.fields.filter((f): f is Exclude<F, L> => !legacy.includes(f));
}

/** 新建分頁時的表頭 */
export function defaultHeaders<F extends string, L extends F>(spec: TableSpec<F, L>): string[] {
  return managedFields(spec).map((f) => spec.labels[f]);
}

/** 維護中的欄位一定有表頭，搬走的不保證還在 */
export type ColumnMap<F extends string, L extends F = never> = Record<Exclude<F, L>, string> &
  Partial<Record<L, string>>;

// ---------------------------------------------------------------------------
// 共同欄位：每種媒介都有的那些。新增媒介時從這裡繼承，不要重抄一份。
// ---------------------------------------------------------------------------

/** 中性的欄名；某張表想叫別的（書的 title 是「書名」）就在自己的 spec 裡覆寫 */
const COMMON_LABELS = {
  id: "編號",
  title: "標題",
  author: "作者",
  platform: "平台",
  sourceUrl: "來源網址",
  startDate: "開始日期",
  endDate: "完成日期",
  domain: "領域",
  subDomain: "次領域",
  type: "屬性",
  language: "語言",
  note: "筆記",
  keywords: "關鍵字",
  private: "私人",
} satisfies Partial<Record<BookField, string>>;

type CommonField = keyof typeof COMMON_LABELS;

const COMMON_ALIASES: Record<CommonField, string[]> = {
  id: ["id", "uuid", "識別碼"],
  title: ["title", "書名", "標題", "書籍名稱"],
  author: ["author", "authors", "作者", "譯者作者"],
  platform: ["platform", "平台", "來源平台"],
  sourceUrl: ["sourceurl", "url", "來源網址", "連結", "網址"],
  startDate: ["startdate", "開始日期", "開始", "起始日期"],
  endDate: ["enddate", "完成日期", "結束日期", "讀完日期"],
  domain: ["domain", "領域", "分類"],
  subDomain: ["subdomain", "子領域", "次領域", "次分類"],
  type: ["type", "屬性", "類型"],
  language: ["language", "語言", "語系"],
  note: ["note", "notes", "筆記", "備註", "心得"],
  keywords: ["keywords", "keyword", "關鍵字", "關鍵詞", "詞條"],
  private: ["private", "私人", "隱私", "不公開"],
};

// ---------------------------------------------------------------------------
// 書籍
// ---------------------------------------------------------------------------

/**
 * app 不再維護的欄位：不會補回缺少的欄，也不會寫入，但表上還在的話仍然讀得到。
 *
 * - 佳句、單字：搬到各自的分頁了
 * - 閱讀狀態：一律由開始／完成日期推導，存一份只是重複
 *
 * 從 Sheet 刪掉之後它們不會再長回來。
 */
export type LegacyField = "quotes" | "vocabulary" | "status";

/** 欄位順序＝新建分頁時的表頭順序，維持舊版的排法，不要重排 */
const BOOK_FIELD_ORDER: BookField[] = [
  "id",
  "title",
  "author",
  "coverUrl",
  "publisher",
  "platform",
  "sourceUrl",
  "status",
  "startDate",
  "endDate",
  "domain",
  "subDomain",
  "type",
  "language",
  "pageCount",
  "wordCount",
  "note",
  "quotes",
  "keywords",
  "relatedArticles",
  "vocabulary",
  "private",
];

type BookOnlyField = Exclude<BookField, CommonField>;

const BOOK_ONLY_LABELS: Record<BookOnlyField, string> = {
  coverUrl: "封面網址",
  publisher: "出版社",
  status: "閱讀狀態",
  pageCount: "頁數",
  wordCount: "字數",
  quotes: "佳句",
  relatedArticles: "相關文章",
  vocabulary: "單字",
};

const BOOK_ONLY_ALIASES: Record<BookOnlyField, string[]> = {
  coverUrl: ["coverurl", "cover", "封面", "封面網址", "封面url"],
  publisher: ["publisher", "出版社", "出版商"],
  status: ["status", "閱讀狀態", "狀態", "進度"],
  pageCount: ["pagecount", "pages", "頁數", "總頁數"],
  wordCount: ["wordcount", "words", "字數", "總字數"],
  quotes: ["quotes", "quote", "佳句", "摘錄", "劃線"],
  relatedArticles: ["relatedarticles", "articles", "相關文章", "延伸閱讀"],
  vocabulary: ["vocabulary", "words", "單字", "生難字詞", "生字"],
};

/**
 * Sheet 欄位一律以中文為主，讓使用者可以直接打開 Google Sheet 編輯。
 * 舊版英文欄名（以及常見的別名）仍然讀得到，不需要手動改表。
 */
export const BOOK_TABLE: TableSpec<BookField, LegacyField> = {
  title: "書籍",
  fields: BOOK_FIELD_ORDER,
  idField: "id",
  legacy: ["quotes", "vocabulary", "status"],
  labels: { ...COMMON_LABELS, ...BOOK_ONLY_LABELS, title: "書名" },
  aliases: { ...COMMON_ALIASES, ...BOOK_ONLY_ALIASES },
};

// ---------------------------------------------------------------------------
// 文章
//
// 跟書籍分開一張表，不是多一個「媒介」欄擠在同一張：Sheet 同時是後台編輯器，
// 混在一起會多出大量對不上的空格（文章沒有封面、出版社、頁數），人就讀不下去。
// 兩者合成一條時間軸是 merge 的事，不是表的事。
// ---------------------------------------------------------------------------

/** 文章沒有開始日期，也沒有出版社——站台名就填在「平台」 */
export const ARTICLE_TABLE: TableSpec<ArticleField> = {
  title: "文章",
  fields: [
    "id",
    "title",
    "author",
    "platform",
    "sourceUrl",
    "endDate",
    "domain",
    "subDomain",
    "type",
    "language",
    "note",
    "keywords",
    "private",
  ],
  idField: "id",
  legacy: [],
  labels: { ...COMMON_LABELS, endDate: "閱讀日期" },
  aliases: {
    ...COMMON_ALIASES,
    endDate: [...COMMON_ALIASES.endDate, "閱讀日期", "日期"],
  },
};

// ---------------------------------------------------------------------------
// 紀事
//
// 工作、輸出、反思、日記、程式共用這一張：欄位一模一樣，分表只會多出一個
// 「這算哪一種」的決定，而那個決定沒有後果。要分開看用「類型」篩就好。
// ---------------------------------------------------------------------------

export const JOURNAL_TABLE: TableSpec<JournalField> = {
  title: "書寫",
  fields: [
    "id",
    "date",
    "title",
    "kind",
    "keywords",
    "note",
    "link",
    "sourceTitle",
    "sourceId",
    "private",
  ],
  idField: "id",
  legacy: [],
  labels: {
    ...COMMON_LABELS,
    date: "日期",
    kind: "類型",
    note: "內文",
    link: "來源",
    sourceTitle: "延伸自",
    sourceId: "延伸自編號",
  },
  aliases: {
    ...COMMON_ALIASES,
    date: ["date", "日期", "完成日期", "紀錄日期"],
    kind: ["kind", "類型", "種類"],
    note: [...COMMON_ALIASES.note, "內文"],
    link: ["link", "url", "來源", "連結", "網址", "來源網址"],
    sourceTitle: ["sourcetitle", "延伸自", "出自", "來源書名"],
    sourceId: ["sourceid", "延伸自編號", "來源編號"],
  },
};

// ---------------------------------------------------------------------------
// 數據
// ---------------------------------------------------------------------------

export const METRIC_TABLE: TableSpec<MetricField> = {
  title: "數據",
  fields: ["id", "date", "journalId", "title", "platform", "views", "reads"],
  idField: "id",
  legacy: [],
  labels: {
    id: "編號",
    date: "日期",
    journalId: "紀事編號",
    title: "標題",
    platform: "平台",
    views: "瀏覽數",
    reads: "閱讀數",
  },
  aliases: {
    id: ["id", "編號", "識別碼"],
    date: ["date", "日期", "量測日期"],
    journalId: ["journalid", "紀事編號"],
    title: ["title", "標題"],
    platform: ["platform", "平台"],
    views: ["views", "viewcount", "pageview", "瀏覽數"],
    reads: ["reads", "readcount", "閱讀數"],
  },
};

// ---------------------------------------------------------------------------
// 表頭對應
// ---------------------------------------------------------------------------

function normalize(header: string) {
  return header.replace(/\s+/g, "").toLowerCase();
}

/** 正式中文欄名永遠算自己的別名，避免遷移後認不得自己寫出去的表頭 */
function aliasesFor<F extends string>(spec: TableSpec<F, F>, field: F): string[] {
  return [spec.labels[field], ...spec.aliases[field]].map(normalize);
}

/**
 * 把實際表頭對應回程式欄位。回傳 field -> 實際表頭字串，
 * 讓讀寫都用使用者當下的欄名，不會因為改成中文就找不到舊資料。
 */
export function mapHeaders<F extends string>(
  spec: TableSpec<F, F>,
  headers: string[],
): Partial<Record<F, string>> {
  const map: Partial<Record<F, string>> = {};
  for (const field of spec.fields) {
    const aliases = aliasesFor(spec, field);
    const match = headers.find((h) => aliases.includes(normalize(h)));
    if (match) map[field] = match;
  }
  return map;
}

/** 表頭沒對應到任何已知欄位的欄，視為使用者自訂欄位，保留不動。 */
export function unknownHeaders<F extends string>(
  spec: TableSpec<F, F>,
  headers: string[],
): string[] {
  const known = new Set(Object.values(mapHeaders(spec, headers)));
  return headers.filter((h) => h.trim() && !known.has(h));
}

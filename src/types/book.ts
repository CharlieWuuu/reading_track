export type BookPlatform =
  "博客來" | "讀墨" | "Kobo" | "Kindle" | "Hyread" | "Pubu" | "實體書" | "其他";

export const BOOK_PLATFORMS: BookPlatform[] = [
  "博客來",
  "讀墨",
  "Kobo",
  "Kindle",
  "Hyread",
  "Pubu",
  "實體書",
  "其他",
];

/**
 * 使用者可能打成「HyRead」「hyread」，那都是同一個平台。
 * 只用來收斂大小寫；平台已經是可自訂的選項，對不上不代表資料有錯。
 */
export function normalizePlatform(raw: string): BookPlatform | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  return BOOK_PLATFORMS.find((p) => p.toLowerCase() === value) ?? null;
}

/**
 * 狀態刻意不開放自訂：統計與月曆要靠它做判斷，可自訂的話語意會散掉。
 * 要自由分類請用領域／屬性／語言。
 *
 * 用詞刻意不寫「想讀」「閱讀中」「已讀完」——這套狀態書籍以外的類別
 * （電影、Podcast……）也要用得上，寫死「讀」就沒辦法套用。
 */
export type RecordStatus = "想要" | "進行" | "完成";

export const RECORD_STATUSES: RecordStatus[] = ["想要", "進行", "完成"];

/** 沒填狀態的舊資料，用日期推一個合理的預設值 */
export function inferStatus(startDate: string | null, endDate: string | null): RecordStatus {
  if (endDate) return "完成";
  if (startDate) return "進行";
  return "想要";
}

/** 跨類型比對用的機器名版本：want／reading／done，不看類型自己的說法 */
export type StatusKey = "want" | "reading" | "done";

export function inferStatusKey(startDate: string | null, endDate: string | null): StatusKey {
  if (endDate) return "done";
  if (startDate) return "reading";
  return "want";
}

export function normalizeStatus(raw: string): RecordStatus | null {
  const value = raw.trim();
  return RECORD_STATUSES.find((s) => s === value) ?? null;
}

export interface Book {
  id: string;
  /** 作品的編號，不是這一次讀的編號——站內連結（佳句、單字、書寫……）都掛在這裡 */
  workId: string;
  /** 記下這一列的時間（ISO）。日期只到日，同一天的先後只有它分得出來 */
  createdAt: string;
  title: string;
  author: string;
  coverUrl: string;
  /** 版本的號碼不是書的身分：紙本與電子書各有一組。認「同一本書」請用 originId */
  isbn: string;
  platform: string; // 這一次在哪讀的：實體書、Kobo
  publisher: string;
  sourceUrl: string;
  status: RecordStatus;
  startDate: string | null;
  endDate: string | null;
  domain: string;
  /** 領域底下的細分，例如 領域「心理」→ 次領域「正念」；沒有就是空字串 */
  subDomain: string;
  type: string;
  language: string;
  /** 紙本／電子書頁數。資料庫存 int，這裡是字串——表單直接綁這個欄位，還沒改形狀 */
  pageCount: string;
  /** 電子書常見的總字數 */
  wordCount: string;
  note: string;
  /** @deprecated 佳句搬到「佳句」分頁了，這欄只留給遷移讀取，app 不再寫入 */
  quotes: string;
  /** 書裡想記下來的東西，一行一個；刻意不分地點／人物，記的當下不該先分類 */
  keywords: string;
  /** 「是」代表私人：鎖上的時候伺服器不會把這一列送到瀏覽器 */
  private: string;
  /** @deprecated 單字搬到「單字」分頁了，這欄只留給遷移讀取，app 不再寫入 */
  vocabulary: string;
  /**
   * 重讀時指回第一次讀的那一列。讀一次的書是空字串。
   *
   * 每讀一次就是新的一列（20 欄有 18 欄一樣），但佳句與單字綁的是列的編號，
   * 也就是「某一次讀」。有了這一欄才聚得回「那本書」——第二次讀時記的句子，
   * 看第一次那列的時候也該出現。
   *
   * 一律指向最初那一列，不是上一次，所以不會接成一條鏈。
   */
  originId: string;
}

/** 字數／頁數顯示成千分位；資料裡本來就可能夾著逗號，先清掉再格式化 */
export function formatCount(value: string | undefined | null): string {
  if (!value) return "";
  const digits = value.replace(/[,，\s]/g, "");
  if (!/^\d+$/.test(digits)) return value;
  return Number(digits).toLocaleString("zh-Hant");
}

/**
 * 一行一筆的欄位（關鍵字、相關文章）共用的解析：去空白、去空行。
 *
 * 也認兩個字的「\n」：JSX 的 attribute 不處理跳脫字元，有一段時間關鍵字被存成
 * 「清邁\n象島」這種一整格的字串。讀的時候一起認，那些格子下次存檔就會自己修好。
 */
export function splitLines(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * 一格裡放多個標籤（目前用在「屬性」）。
 *
 * 分隔符寫入時固定用頓號，讀取時連逗號、直線都接受——早年的資料是在試算表裡
 * 手打，硬性要求某一種符號只會讓資料變髒。
 */
export const TAG_SEPARATOR = "、";

export function splitTags(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/[、,，｜|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function joinTags(tags: string[]): string {
  return tags.join(TAG_SEPARATOR);
}

/** 讀某一筆紀錄上的某個欄位；那種紀錄沒有這一欄就當空的 */
export function fieldValue(item: object, field: string): string {
  const value = (item as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

export type CategorySource = "book" | "article" | "writings";

/**
 * 每一組選項對應到哪種紀錄的哪個欄位。
 *
 * 書與文章共用同一棵領域樹：兩邊都是「讀別人寫的東西」，問的是同一件事——
 * 一本講心理的書跟一篇講心理的文章就是同一個領域。分成兩份的代價是同一個詞
 * 要打兩次、慢慢長歪，統計也合不起來。
 *
 * 紀事沒有領域，它只用「主題」分——那問的是「這件事屬於我生活的哪一塊」，
 * 跟「這份內容在講什麼」不是同一個問題。
 */
export const CATEGORY_FIELDS: Record<
  keyof BookCategories,
  { field: string; sources: CategorySource[] }
> = {
  platform: { field: "platform", sources: ["book", "article"] },
  domain: { field: "domain", sources: ["book", "article"] },
  subDomain: { field: "subDomain", sources: ["book", "article"] },
  type: { field: "type", sources: ["book", "article"] },
  language: { field: "language", sources: ["book", "article"] },
  topic: { field: "topic", sources: ["writings"] },
};

export interface BookCategories {
  platform: string[];
  domain: string[];
  subDomain: string[];
  type: string[];
  language: string[];
  /** 紀事的主題；書籍沒有這一欄，但選項統一存在同一張「選項」分頁 */
  topic: string[];
}

/**
 * 全部刻意留空。
 *
 * 預設一套分類只會塞進一堆沒人用的選項，而且選單上分不出哪些是你真的在用的。
 * 清單一律由「資料上實際出現過的值」長出來（見 useCategories），
 * 想固定下來就自己在設定頁維護。
 *
 * BOOK_PLATFORMS 仍然留著，但只給 normalizePlatform 收斂大小寫用，不當預設選項。
 */
export const DEFAULT_CATEGORIES: BookCategories = {
  platform: [],
  domain: [],
  subDomain: [],
  type: [],
  language: [],
  topic: [],
};

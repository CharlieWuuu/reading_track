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
 * 使用者可能在 Sheet 打成「HyRead」「hyread」，那都是同一個平台。
 * 只用來收斂大小寫；平台已經是可自訂的選項，對不上不代表資料有錯。
 */
export function normalizePlatform(raw: string): BookPlatform | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  return BOOK_PLATFORMS.find((p) => p.toLowerCase() === value) ?? null;
}

/**
 * 閱讀狀態刻意不開放自訂：統計與月曆要靠它做判斷，
 * 可自訂的話語意會散掉。要自由分類請用領域／屬性／語言。
 */
export type ReadingStatus = "想讀" | "閱讀中" | "已讀完";

export const READING_STATUSES: ReadingStatus[] = ["想讀", "閱讀中", "已讀完"];

/** 沒填狀態的舊資料，用日期推一個合理的預設值 */
export function inferStatus(startDate: string | null, endDate: string | null): ReadingStatus {
  if (endDate) return "已讀完";
  if (startDate) return "閱讀中";
  return "想讀";
}

export function normalizeStatus(raw: string): ReadingStatus | null {
  const value = raw.trim();
  return READING_STATUSES.find((s) => s === value) ?? null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  publisher: string;
  /** 平台是可自訂的選項，不再限定在 BOOK_PLATFORMS 裡 */
  platform: string;
  sourceUrl: string;
  status: ReadingStatus;
  startDate: string | null;
  endDate: string | null;
  domain: string;
  /** 領域底下的細分，例如 領域「心理」→ 次領域「正念」；沒有就是空字串 */
  subDomain: string;
  type: string;
  language: string;
  /** 紙本／電子書頁數，以字串保存，方便使用者直接在 Sheet 編輯 */
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
  /** 相關文章，一行一個網址 */
  relatedArticles: string;
  /** @deprecated 單字搬到「單字」分頁了，這欄只留給遷移讀取，app 不再寫入 */
  vocabulary: string;
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

export interface Quote {
  text: string;
  /** 沒寫章節就是空字串。電子書多半沒有頁碼，所以記章節而不是頁數 */
  chapter: string;
  /** 讀到這句時想說的話，跟整本書的心得分開 */
  note: string;
}

/**
 * 佳句一行一句，三個欄位以直線分隔：
 *   真正的問題不是資源，而是注意力｜第3章｜這句話解釋了我為什麼老是覺得沒時間
 *
 * 用固定分隔符而不是括號：句子與心得裡本來就常有括號，靠括號位置去猜哪個是
 * 章節一定會出錯。尾端沒填的欄位可以整個省略。
 */
export const QUOTE_SEPARATOR = "｜";

export function parseQuotes(raw: string | undefined | null): Quote[] {
  return splitLines(raw).map((line) => {
    // 舊格式「句子（章節）」還讀得到，不用手動改表
    if (!line.includes(QUOTE_SEPARATOR)) return parseLegacyQuote(line);

    const [text, chapter, note] = line.split(QUOTE_SEPARATOR).map((part) => part.trim());
    return { text: text ?? "", chapter: chapter ?? "", note: note ?? "" };
  });
}

/** 舊格式：行尾的括號（全形或半形）視為章節，其餘都是句子本身 */
function parseLegacyQuote(line: string): Quote {
  const match = line.match(/^(.*?)\s*[（(]([^（()）]*)[)）]\s*$/);
  if (!match || !match[1].trim()) return { text: line, chapter: "", note: "" };
  return { text: match[1].trim(), chapter: match[2].trim(), note: "" };
}

/**
 * 一格裡放多個標籤（目前用在「屬性」）。
 *
 * 分隔符寫入時固定用頓號，讀取時連逗號、直線都接受——使用者會直接在 Sheet 裡
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

export interface VocabularyItem {
  word: string;
  /** 詞的翻譯／解釋，沒有就是空字串 */
  wordTranslation: string;
  sentence: string;
  sentenceTranslation: string;
  chapter: string;
  /** 這個詞是什麼語言。空字串代表跟著書的語言走 */
  language: string;
}

/**
 * 單字一行一筆，六個欄位以直線分隔：
 *   apposition｜同位語｜The city, Kyoto, was...｜京都這座城市……｜第3章｜英文
 *
 * 用固定分隔符而不是括號：翻譯、例句、章節裡本來就常有括號，
 * 靠括號位置去猜哪個是哪個一定會出錯。尾端沒填的欄位可以整個省略。
 */
export const VOCABULARY_SEPARATOR = "｜";

export function parseVocabulary(raw: string | undefined | null): VocabularyItem[] {
  return splitLines(raw).map((line) => {
    // 舊格式「詞：例句（章節）」還讀得到，不用手動改表
    if (!line.includes(VOCABULARY_SEPARATOR)) return parseLegacyVocabulary(line);

    const [word, wordTranslation, sentence, sentenceTranslation, chapter, language] = line
      .split(VOCABULARY_SEPARATOR)
      .map((part) => part.trim());
    return {
      word: word ?? "",
      wordTranslation: wordTranslation ?? "",
      sentence: sentence ?? "",
      sentenceTranslation: sentenceTranslation ?? "",
      chapter: chapter ?? "",
      language: language ?? "",
    };
  });
}

/** 舊格式：詞：例句（章節） */
function parseLegacyVocabulary(line: string): VocabularyItem {
  const [head, ...rest] = line.split(/[:：]/);
  const quote = parseQuotes(rest.join("：").trim())[0];
  return {
    word: head.trim(),
    wordTranslation: "",
    sentence: quote?.text ?? "",
    sentenceTranslation: "",
    chapter: quote?.chapter ?? "",
    language: "",
  };
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
 * 領域與次領域刻意三邊分開：書的領域是「為什麼讀這本書」，紀事的領域是
 * 「這件事屬於我生活的哪一塊」，硬共用一份清單只會讓兩邊的選單都變得很吵。
 * 平台、屬性、語言仍然共用——那些在書與文章上問的是同一件事。
 */
export const CATEGORY_FIELDS: Record<
  keyof BookCategories,
  { field: string; sources: CategorySource[] }
> = {
  platform: { field: "platform", sources: ["book", "article"] },
  domain: { field: "domain", sources: ["book"] },
  subDomain: { field: "subDomain", sources: ["book"] },
  type: { field: "type", sources: ["book", "article"] },
  language: { field: "language", sources: ["book", "article"] },
  articleDomain: { field: "domain", sources: ["article"] },
  articleSubDomain: { field: "subDomain", sources: ["article"] },
  kind: { field: "kind", sources: ["writings"] },
};

export interface BookCategories {
  platform: string[];
  domain: string[];
  subDomain: string[];
  type: string[];
  language: string[];
  /** 文章的領域與次領域，跟書籍各自一份清單 */
  articleDomain: string[];
  articleSubDomain: string[];
  /** 紀事的類型；書籍沒有這一欄，但選項統一存在同一張「選項」分頁 */
  kind: string[];
}

/**
 * 全部刻意留空。
 *
 * 預設一套分類只會塞進一堆沒人用的選項，而且選單上分不出哪些是你真的在用的。
 * 清單一律由「資料上實際出現過的值」長出來（見 useCategories），
 * 想固定下來就自己在設定頁或 Sheet 上維護。
 *
 * BOOK_PLATFORMS 仍然留著，但只給 normalizePlatform 收斂大小寫用，不當預設選項。
 */
export const DEFAULT_CATEGORIES: BookCategories = {
  platform: [],
  domain: [],
  subDomain: [],
  type: [],
  language: [],
  articleDomain: [],
  articleSubDomain: [],
  kind: [],
};

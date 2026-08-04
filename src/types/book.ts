export type BookPlatform =
  | "博客來"
  | "讀墨"
  | "Kobo"
  | "Kindle"
  | "Hyread"
  | "Pubu"
  | "實體書"
  | "其他";

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
 * 對不上的才真的當成未知平台。
 */
export function normalizePlatform(raw: string): BookPlatform | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  return BOOK_PLATFORMS.find((p) => p.toLowerCase() === value) ?? null;
}

/**
 * 閱讀狀態刻意不開放自訂：統計與日曆要靠它做判斷，
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
  platform: BookPlatform;
  sourceUrl: string;
  status: ReadingStatus;
  startDate: string | null;
  endDate: string | null;
  domain: string;
  type: string;
  language: string;
  /** 紙本／電子書頁數，以字串保存，方便使用者直接在 Sheet 編輯 */
  pageCount: string;
  /** 電子書常見的總字數 */
  wordCount: string;
  note: string;
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

export interface BookCategories {
  domain: string[];
  type: string[];
  language: string[];
}

export const DEFAULT_CATEGORIES: BookCategories = {
  domain: ["社會科學", "文學", "語言學", "歷史", "科普", "商業"],
  type: ["工具書", "小說", "散文", "詩", "傳記"],
  language: ["中文", "英文", "日文", "台文"],
};

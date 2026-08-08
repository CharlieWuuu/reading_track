import { OAuth2Client } from "google-auth-library";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import {
  Book,
  BookCategories,
  DEFAULT_CATEGORIES,
  inferStatus,
  normalizePlatform,
  normalizeStatus,
  parseQuotes,
  parseVocabulary,
  splitLines,
} from "@/types/book";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { BOOK_FIELDS, BookField, COLUMN_LABELS, mapHeaders } from "./sheetSchema";

const BOOKS_SHEET_TITLE = "書籍";

const DEFAULT_HEADERS = BOOK_FIELDS.map((f) => COLUMN_LABELS[f]);

function getAuthClient(accessToken: string) {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

/**
 * 現有表頭 -> 欄位對照，順便把表頭整理成正式的中文欄名：
 *
 * - 認得的舊欄名（例如 `title`、`coverUrl`）就地改寫成中文，**位置不動**，
 *   所以底下的資料不會跑掉
 * - 缺少的欄位補到最右邊（不能插在中間，理由見下）
 * - 認不出來的欄位當成使用者自訂，原樣保留
 */
async function resolveColumns(sheet: GoogleSpreadsheetWorksheet) {
  await sheet.loadHeaderRow().catch(() => null);
  const headers = trimTrailingBlanks(sheet.headerValues ?? []);
  const map = mapHeaders(headers);

  // 實際表頭 -> 欄位，用來判斷某一欄該不該改名
  const fieldByHeader = new Map<string, BookField>();
  for (const field of BOOK_FIELDS) {
    const header = map[field];
    if (header) fieldByHeader.set(header, field);
  }

  const renamed = headers.map((header) => {
    const field = fieldByHeader.get(header);
    return field ? COLUMN_LABELS[field] : header;
  });

  const missing = BOOK_FIELDS.filter((f) => !map[f]);
  // 萬一表裡同時有「coverUrl」和「封面網址」，改名會撞成兩個同名欄，
  // 那就別改名了，只補缺的欄，交給使用者自己決定要留哪一個
  const safeToRename = new Set(renamed).size === renamed.length;
  const base = safeToRename ? renamed : headers;
  //
  // 一律補在最右邊，不要試著插在「它應該在」的位置：setHeaderRow 只重寫表頭
  // 那一列，底下的資料不會跟著右移，在中間插一欄會讓右邊每一欄都對錯資料。
  // 想調欄位順序請直接在 Sheet 上整欄搬移，app 是靠表頭名字對應的，位置不影響。
  //
  const nextHeaders = [...base, ...missing.map((f) => COLUMN_LABELS[f])];

  const changed =
    nextHeaders.length !== headers.length || nextHeaders.some((h, i) => h !== headers[i]);

  if (!changed) return assertComplete(map);

  await sheet.setHeaderRow(nextHeaders);
  return assertComplete(mapHeaders(nextHeaders));
}

/**
 * 每個欄位都必須對應得到表頭。少一個就代表 COLUMN_LABELS 與 COLUMN_ALIASES 沒對上，
 * 這時候硬跑下去會拿 undefined 去定位儲存格，寫壞使用者的資料——寧可直接失敗。
 */
function assertComplete(map: Partial<Record<BookField, string>>): Record<BookField, string> {
  const missing = BOOK_FIELDS.filter((f) => !map[f]);
  if (missing.length > 0) {
    throw new Error(`表頭對應不完整，缺少：${missing.join(", ")}`);
  }
  return map as Record<BookField, string>;
}

/** 只砍掉尾端的空欄，中間的空欄要留著，不然整排資料會左移對不上 */
function trimTrailingBlanks(headers: string[]): string[] {
  let end = headers.length;
  while (end > 0 && !headers[end - 1]?.trim()) end--;
  return headers.slice(0, end);
}

/** 表頭字串 -> 欄索引（0 起算），批次寫入時用來定位儲存格 */
function headerIndex(sheet: GoogleSpreadsheetWorksheet): Record<string, number> {
  const index: Record<string, number> = {};
  sheet.headerValues.forEach((header, i) => {
    index[header] = i;
  });
  return index;
}

async function getBooksSheet(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[BOOKS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: BOOKS_SHEET_TITLE,
      headerValues: DEFAULT_HEADERS,
    });
  }
  const columns = await resolveColumns(sheet);
  return { sheet, columns };
}

export async function verifySheetAccess(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();
  return { title: doc.title };
}

export async function listBooks(sheetId: string, accessToken: string): Promise<Book[]> {
  const { books } = await listBooksWithMeta(sheetId, accessToken);
  return books;
}

/** 同時回報這次補了幾個編號，讓「補齊資料」可以顯示進度 */
export async function listBooksWithMeta(
  sheetId: string,
  accessToken: string,
): Promise<{ books: Book[]; idsBackfilled: number }> {
  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  let rows = await sheet.getRows();

  const rowsMissingId = rows.filter((row) => !row.get(columns.id));
  if (rowsMissingId.length > 0) {
    // 一列一次 row.save() 會打爆 Google Sheets 的每分鐘寫入配額，改成一次批次寫入
    await sheet.loadCells();
    const idColumn = headerIndex(sheet)[columns.id];
    for (const row of rowsMissingId) {
      sheet.getCell(row.rowNumber - 1, idColumn).value = crypto.randomUUID();
    }
    await sheet.saveUpdatedCells();

    // re-read so we return the ids that were actually persisted, avoiding a
    // mismatch if a concurrent call backfilled the same rows with different ids
    rows = await sheet.getRows();
  }

  const books = rows.map((row) => {
    const get = (field: BookField) => (row.get(columns[field]) ?? "").toString().trim();
    return {
      id: get("id"),
      title: get("title"),
      author: get("author"),
      coverUrl: get("coverUrl"),
      publisher: get("publisher"),
      // 大小寫不同一律收斂成正式名稱（HyRead／hyread）；
      // 認不得的就照原樣留著——平台已經是使用者可自訂的選項了
      platform: normalizePlatform(get("platform")) ?? get("platform") ?? "",
      // 舊資料沒有這欄，用日期推一個合理的預設值
      status:
        normalizeStatus(get("status")) ??
        inferStatus(get("startDate") || null, get("endDate") || null),
      sourceUrl: get("sourceUrl"),
      startDate: get("startDate") || null,
      endDate: get("endDate") || null,
      domain: get("domain"),
      subDomain: get("subDomain"),
      type: get("type"),
      language: get("language"),
      pageCount: get("pageCount"),
      wordCount: get("wordCount"),
      note: get("note"),
      quotes: get("quotes"),
      keywords: get("keywords"),
      relatedArticles: get("relatedArticles"),
      vocabulary: get("vocabulary"),
    };
  });

  return { books, idsBackfilled: rowsMissingId.length };
}

export async function addBookRow(sheetId: string, accessToken: string, book: Book) {
  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  const raw: Record<string, string> = {};
  for (const field of BOOK_FIELDS) {
    raw[columns[field]] = book[field] ?? "";
  }
  await sheet.addRow(raw);
}

export async function updateBookRow(
  sheetId: string,
  accessToken: string,
  id: string,
  patch: Partial<Book>,
) {
  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get(columns.id) === id);
  if (!row) throw new Error("找不到這筆書籍紀錄");

  for (const [key, value] of Object.entries(patch)) {
    const header = columns[key as BookField];
    if (header) row.set(header, value ?? "");
  }
  await row.save();
}

/**
 * 一次寫回多筆書籍。
 *
 * 千萬別在迴圈裡呼叫 updateBookRow —— 那樣每本書都會重新載入試算表並各存一次檔，
 * 幾十本書就會撞到 Google Sheets 每分鐘 60 次的寫入配額。這裡改成把所有異動
 * 寫進儲存格快取，最後只送出一次批次更新。
 *
 * @returns 實際寫入的儲存格數量
 */
export async function bulkUpdateBooks(
  sheetId: string,
  accessToken: string,
  patches: Map<string, Partial<Book>>,
): Promise<number> {
  if (patches.size === 0) return 0;

  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  await sheet.loadCells();

  const index = headerIndex(sheet);
  let written = 0;

  for (const row of rows) {
    const patch = patches.get(row.get(columns.id));
    if (!patch) continue;

    for (const [key, value] of Object.entries(patch)) {
      const column = index[columns[key as BookField]];
      if (column === undefined) continue;
      sheet.getCell(row.rowNumber - 1, column).value = value ?? "";
      written++;
    }
  }

  await sheet.saveUpdatedCells();
  return written;
}

// ---------------------------------------------------------------------------
// 自訂選項（領域／屬性／語言）
//
// 存在同一份試算表的「選項」工作表，兩欄：類別 | 選項。
// 放雲端才不會換裝置就消失，而且使用者也能直接在 Sheet 裡編輯。
// ---------------------------------------------------------------------------

const OPTIONS_SHEET_TITLE = "選項";
const OPTIONS_HEADERS = ["類別", "選項"];

const CATEGORY_LABELS: Record<keyof BookCategories, string> = {
  platform: "平台",
  domain: "領域",
  subDomain: "次領域",
  type: "屬性",
  language: "語言",
};

function categoryKeyOf(label: string): keyof BookCategories | null {
  const entry = Object.entries(CATEGORY_LABELS).find(([, name]) => name === label.trim());
  return entry ? (entry[0] as keyof BookCategories) : null;
}

async function getOptionsSheet(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[OPTIONS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: OPTIONS_SHEET_TITLE,
      headerValues: OPTIONS_HEADERS,
    });
    // 第一次建立時放入預設選項，不然使用者會看到空白下拉選單
    await sheet.addRows(
      (Object.keys(CATEGORY_LABELS) as (keyof BookCategories)[]).flatMap((key) =>
        DEFAULT_CATEGORIES[key].map((option) => ({
          類別: CATEGORY_LABELS[key],
          選項: option,
        })),
      ),
    );
  }
  return sheet;
}

export async function listCategories(
  sheetId: string,
  accessToken: string,
): Promise<BookCategories> {
  const sheet = await getOptionsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();

  const categories: BookCategories = {
    platform: [],
    domain: [],
    subDomain: [],
    type: [],
    language: [],
  };
  for (const row of rows) {
    const key = categoryKeyOf((row.get("類別") ?? "").toString());
    const option = (row.get("選項") ?? "").toString().trim();
    if (!key || !option || categories[key].includes(option)) continue;
    categories[key].push(option);
  }

  // 舊的試算表沒有「平台」那組，整組空白時退回預設值，
  // 否則使用者會看到一個空的下拉選單，不知道該填什麼
  for (const key of Object.keys(categories) as (keyof BookCategories)[]) {
    if (categories[key].length === 0) categories[key] = [...DEFAULT_CATEGORIES[key]];
  }
  return categories;
}

/** 整組覆寫。選項數量不多，重寫比逐列比對簡單也不容易出錯。 */
export async function saveCategories(
  sheetId: string,
  accessToken: string,
  categories: BookCategories,
) {
  const sheet = await getOptionsSheet(sheetId, accessToken);
  await sheet.clearRows();
  await sheet.addRows(
    (Object.keys(CATEGORY_LABELS) as (keyof BookCategories)[]).flatMap((key) =>
      categories[key].map((option) => ({
        類別: CATEGORY_LABELS[key],
        選項: option,
      })),
    ),
  );
}

export async function deleteBookRow(sheetId: string, accessToken: string, id: string) {
  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get(columns.id) === id);
  if (!row) return;
  await row.delete();
}

const KEYWORDS_SHEET_TITLE = "關鍵字";
const KEYWORD_HEADERS = ["名稱", "學科", "座標", "起訖", "維基連結", "摘要"];

async function getKeywordsSheet(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[KEYWORDS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: KEYWORDS_SHEET_TITLE,
      headerValues: KEYWORD_HEADERS,
    });
  }
  return sheet;
}

/** 關鍵字主檔跨書共用，查過的就不再查一次 */
export async function listKeywordInfos(
  sheetId: string,
  accessToken: string,
): Promise<KeywordInfo[]> {
  const sheet = await getKeywordsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();

  return rows
    .map((row) => ({
      name: (row.get("名稱") ?? "").toString().trim(),
      topics: (row.get("學科") ?? "").toString().trim(),
      coordinates: (row.get("座標") ?? "").toString().trim(),
      span: (row.get("起訖") ?? "").toString().trim(),
      wikiUrl: (row.get("維基連結") ?? "").toString().trim(),
      summary: (row.get("摘要") ?? "").toString().trim(),
    }))
    .filter((info) => info.name);
}

/**
 * 新的加一列，已經在表裡的就地更新。
 *
 * 不能只做 append：查不到的詞也會留下一列空白，之後重查就得改那一列，
 * 不然同一個名字會愈疊愈多列。
 */
export async function saveKeywordInfos(sheetId: string, accessToken: string, infos: KeywordInfo[]) {
  if (infos.length === 0) return;
  const sheet = await getKeywordsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const byName = new Map(rows.map((row) => [(row.get("名稱") ?? "").toString().trim(), row]));

  const added = [];
  for (const info of infos) {
    const row = byName.get(info.name);
    if (!row) {
      added.push(toRowValues(info));
      continue;
    }
    // 只填空格。使用者可以直接在 Sheet 上手動補資料，手寫的比維基查回來的可信，
    // 不能被一鍵補齊蓋掉——理由同書籍的「重新抓取」。
    let changed = false;
    for (const [header, value] of Object.entries(toRowValues(info))) {
      if (!value || (row.get(header) ?? "").toString().trim()) continue;
      row.set(header, value);
      changed = true;
    }
    if (changed) await row.save();
  }
  if (added.length > 0) await sheet.addRows(added);
}

/**
 * 關鍵字改名：主檔那一列跟著改，同時改寫所有引用它的書。
 *
 * 這是整套設計裡唯一會斷掉的地方——書籍表用「名字」指向主檔，名字一改就對不上。
 * 所以改名一定要走這條路；直接在 Sheet 上改主檔的名稱，那些書就會變成引用一個
 * 不存在的關鍵字（關鍵字頁會把它列成「沒有書在用」）。
 *
 * @returns 連帶改到幾本書
 */
export async function renameKeyword(
  sheetId: string,
  accessToken: string,
  from: string,
  to: string,
): Promise<number> {
  const books = await listBooks(sheetId, accessToken);
  const patches = new Map<string, Partial<Book>>();

  for (const book of books) {
    const lines = splitLines(book.keywords);
    if (!lines.includes(from)) continue;
    // 改成一個已經存在的名字＝合併，所以要去重，不然那本書會出現兩個一樣的關鍵字
    const next = [...new Set(lines.map((line) => (line === from ? to : line)))];
    patches.set(book.id, { keywords: next.join("\n") });
  }

  await bulkUpdateBooks(sheetId, accessToken, patches);
  return patches.size;
}

/** 使用者親手改的那一列，整列照寫——這裡不是自動補齊，不必保護既有值 */
export async function replaceKeywordInfo(
  sheetId: string,
  accessToken: string,
  info: KeywordInfo,
  /** 改名時傳入原本的名字，才找得到要改的是哪一列 */
  previousName?: string,
) {
  const sheet = await getKeywordsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const named = (row: GoogleSpreadsheetRow) => (row.get("名稱") ?? "").toString().trim();

  // 改名時，改成的那個名字可能已經有一列（＝合併），留一列就好
  if (previousName && previousName !== info.name) {
    const duplicate = rows.find((row) => named(row) === info.name);
    if (duplicate) await duplicate.delete();
  }

  const row = rows.find((r) => named(r) === (previousName || info.name));
  if (!row) {
    await sheet.addRows([toRowValues(info)]);
    return;
  }
  for (const [header, value] of Object.entries(toRowValues(info))) row.set(header, value);
  await row.save();
}

function toRowValues(info: KeywordInfo): Record<string, string> {
  return {
    名稱: info.name,
    學科: info.topics,
    座標: info.coordinates,
    起訖: info.span,
    維基連結: info.wikiUrl,
    摘要: info.summary,
  };
}

const VOCABULARY_SHEET_TITLE = "單字";
const VOCABULARY_HEADERS = [
  "編號",
  "書籍編號",
  "書名",
  "詞",
  "詞翻譯",
  "例句",
  "例句翻譯",
  "章節",
  "語言",
];

const QUOTES_SHEET_TITLE = "佳句";
const QUOTE_HEADERS = ["編號", "書籍編號", "書名", "佳句", "章節", "心得"];

async function getRecordSheet(
  sheetId: string,
  accessToken: string,
  title: string,
  headerValues: string[],
) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[title];
  if (sheet) return sheet;
  return doc.addSheet({ title, headerValues });
}

function text(row: GoogleSpreadsheetRow, header: string): string {
  return (row.get(header) ?? "").toString().trim();
}

export async function listVocabularyRows(
  sheetId: string,
  accessToken: string,
): Promise<VocabularyRow[]> {
  const sheet = await getRecordSheet(
    sheetId,
    accessToken,
    VOCABULARY_SHEET_TITLE,
    VOCABULARY_HEADERS,
  );
  const rows = await sheet.getRows();

  return rows
    .map((row) => ({
      id: text(row, "編號"),
      bookId: text(row, "書籍編號"),
      bookTitle: text(row, "書名"),
      word: text(row, "詞"),
      wordTranslation: text(row, "詞翻譯"),
      sentence: text(row, "例句"),
      sentenceTranslation: text(row, "例句翻譯"),
      chapter: text(row, "章節"),
      language: text(row, "語言"),
    }))
    .filter((item) => item.word);
}

export async function listQuoteRows(sheetId: string, accessToken: string): Promise<QuoteRow[]> {
  const sheet = await getRecordSheet(sheetId, accessToken, QUOTES_SHEET_TITLE, QUOTE_HEADERS);
  const rows = await sheet.getRows();

  return rows
    .map((row) => ({
      id: text(row, "編號"),
      bookId: text(row, "書籍編號"),
      bookTitle: text(row, "書名"),
      text: text(row, "佳句"),
      chapter: text(row, "章節"),
      note: text(row, "心得"),
    }))
    .filter((item) => item.text);
}

/**
 * 一本書的紀錄整批換掉：先刪掉屬於它的列，再把新的加回去。
 *
 * 不做逐列比對是刻意的——一本書的單字或佳句頂多幾十筆，整批換掉的邏輯
 * 少一個數量級的分支，也不會有「改到一半失敗、剩下半新半舊」的狀態。
 * 刪除要由後往前，不然刪掉一列會讓後面每一列的位置都往前跑。
 */
async function replaceBookRows(
  sheet: GoogleSpreadsheetWorksheet,
  bookId: string,
  values: Record<string, string>[],
) {
  const rows = await sheet.getRows();
  const mine = rows.filter((row) => text(row, "書籍編號") === bookId);
  for (const row of mine.reverse()) await row.delete();
  if (values.length > 0) await sheet.addRows(values);
}

export async function replaceBookVocabulary(
  sheetId: string,
  accessToken: string,
  bookId: string,
  bookTitle: string,
  items: VocabularyRow[],
) {
  const sheet = await getRecordSheet(
    sheetId,
    accessToken,
    VOCABULARY_SHEET_TITLE,
    VOCABULARY_HEADERS,
  );
  await replaceBookRows(
    sheet,
    bookId,
    items
      .filter((item) => item.word.trim())
      .map((item) => ({
        編號: item.id || crypto.randomUUID(),
        書籍編號: bookId,
        書名: bookTitle,
        詞: item.word,
        詞翻譯: item.wordTranslation,
        例句: item.sentence,
        例句翻譯: item.sentenceTranslation,
        章節: item.chapter,
        語言: item.language,
      })),
  );
}

export async function replaceBookQuotes(
  sheetId: string,
  accessToken: string,
  bookId: string,
  bookTitle: string,
  items: QuoteRow[],
) {
  const sheet = await getRecordSheet(sheetId, accessToken, QUOTES_SHEET_TITLE, QUOTE_HEADERS);
  await replaceBookRows(
    sheet,
    bookId,
    items
      .filter((item) => item.text.trim())
      .map((item) => ({
        編號: item.id || crypto.randomUUID(),
        書籍編號: bookId,
        書名: bookTitle,
        佳句: item.text,
        章節: item.chapter,
        心得: item.note,
      })),
  );
}

/**
 * 把書籍表裡舊的「單字」「佳句」儲存格搬進各自的分頁。
 *
 * 只搬、不刪：舊欄位留著當退路，確認新表沒問題之後再手動清掉。
 * 已經有紀錄的書會整個跳過，所以重跑幾次都不會變出重複的列。
 */
export async function migrateNotesToSheets(
  sheetId: string,
  accessToken: string,
): Promise<{ books: number; vocabulary: number; quotes: number }> {
  const books = await listBooks(sheetId, accessToken);
  const [existingVocabulary, existingQuotes] = await Promise.all([
    listVocabularyRows(sheetId, accessToken),
    listQuoteRows(sheetId, accessToken),
  ]);
  const hasVocabulary = new Set(existingVocabulary.map((row) => row.bookId));
  const hasQuotes = new Set(existingQuotes.map((row) => row.bookId));

  const moved = { books: 0, vocabulary: 0, quotes: 0 };

  for (const book of books) {
    const vocabulary = hasVocabulary.has(book.id) ? [] : parseVocabulary(book.vocabulary);
    const quotes = hasQuotes.has(book.id) ? [] : parseQuotes(book.quotes);
    if (vocabulary.length === 0 && quotes.length === 0) continue;

    if (vocabulary.length > 0) {
      await replaceBookVocabulary(
        sheetId,
        accessToken,
        book.id,
        book.title,
        vocabulary.map((item) => ({ ...item, id: "", bookId: book.id, bookTitle: book.title })),
      );
      moved.vocabulary += vocabulary.length;
    }

    if (quotes.length > 0) {
      await replaceBookQuotes(
        sheetId,
        accessToken,
        book.id,
        book.title,
        quotes.map((quote) => ({ ...quote, id: "", bookId: book.id, bookTitle: book.title })),
      );
      moved.quotes += quotes.length;
    }
    moved.books++;
  }

  return moved;
}

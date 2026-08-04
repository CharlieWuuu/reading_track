import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { OAuth2Client } from "google-auth-library";
import {
  Book,
  BookCategories,
  DEFAULT_CATEGORIES,
  inferStatus,
  normalizePlatform,
  normalizeStatus,
} from "@/types/book";
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
 * - 缺少的欄位補到最右邊
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
  accessToken: string
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
      status: normalizeStatus(get("status")) ?? inferStatus(get("startDate") || null, get("endDate") || null),
      sourceUrl: get("sourceUrl"),
      startDate: get("startDate") || null,
      endDate: get("endDate") || null,
      domain: get("domain"),
      type: get("type"),
      language: get("language"),
      pageCount: get("pageCount"),
      wordCount: get("wordCount"),
      note: get("note"),
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
  patch: Partial<Book>
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
  patches: Map<string, Partial<Book>>
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
        }))
      )
    );
  }
  return sheet;
}

export async function listCategories(
  sheetId: string,
  accessToken: string
): Promise<BookCategories> {
  const sheet = await getOptionsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();

  const categories: BookCategories = { platform: [], domain: [], type: [], language: [] };
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
  categories: BookCategories
) {
  const sheet = await getOptionsSheet(sheetId, accessToken);
  await sheet.clearRows();
  await sheet.addRows(
    (Object.keys(CATEGORY_LABELS) as (keyof BookCategories)[]).flatMap((key) =>
      categories[key].map((option) => ({
        類別: CATEGORY_LABELS[key],
        選項: option,
      }))
    )
  );
}

export async function deleteBookRow(sheetId: string, accessToken: string, id: string) {
  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get(columns.id) === id);
  if (!row) return;
  await row.delete();
}

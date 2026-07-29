import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { OAuth2Client } from "google-auth-library";
import { Book, BookPlatform, normalizePlatform } from "@/types/book";
import { BOOK_FIELDS, BookField, COLUMN_LABELS, mapHeaders } from "./sheetSchema";

const BOOKS_SHEET_TITLE = "書籍";

const DEFAULT_HEADERS = BOOK_FIELDS.map((f) => COLUMN_LABELS[f]);

function getAuthClient(accessToken: string) {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

/**
 * 現有表頭 -> 欄位對照。缺少的欄位（例如新增的頁數／字數）會補到表頭最右邊，
 * 使用者自訂的欄位維持原位不動。
 */
async function resolveColumns(sheet: GoogleSpreadsheetWorksheet) {
  await sheet.loadHeaderRow().catch(() => null);
  const headers = sheet.headerValues ?? [];
  let map = mapHeaders(headers);

  const missing = BOOK_FIELDS.filter((f) => !map[f]);
  if (missing.length > 0) {
    // 保留使用者自訂欄位的位置，只在最右邊補上缺的欄
    const nextHeaders = [
      ...headers.filter((h) => h.trim()),
      ...missing.map((f) => COLUMN_LABELS[f]),
    ];
    await sheet.setHeaderRow(nextHeaders);
    map = mapHeaders(nextHeaders);
  }

  return map as Record<BookField, string>;
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
      // 大小寫不同一律收斂成正式名稱，下拉選單才選得起來
      platform: normalizePlatform(get("platform")) ?? ((get("platform") || "其他") as BookPlatform),
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

export async function deleteBookRow(sheetId: string, accessToken: string, id: string) {
  const { sheet, columns } = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get(columns.id) === id);
  if (!row) return;
  await row.delete();
}

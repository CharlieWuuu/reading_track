import { OAuth2Client } from "google-auth-library";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { Article } from "@/types/article";
import { Book, inferStatus, normalizePlatform, normalizeStatus, splitLines } from "@/types/book";
import { Entry } from "@/types/entry";
import { KeywordInfo } from "@/types/keyword";
import { Metric } from "@/types/metric";
import { QuoteRow, VocabularyRow } from "@/types/record";
import {
  ARTICLE_TABLE,
  BOOK_TABLE,
  BookField,
  ColumnMap,
  defaultHeaders,
  ENTRY_TABLE,
  managedFields,
  mapHeaders,
  METRIC_TABLE,
  TableSpec,
} from "./sheet-schema";

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
async function resolveColumns<F extends string, L extends F>(
  sheet: GoogleSpreadsheetWorksheet,
  spec: TableSpec<F, L>,
) {
  await sheet.loadHeaderRow().catch(() => null);
  const headers = trimTrailingBlanks(sheet.headerValues ?? []);
  const map = mapHeaders(spec, headers);
  const managed = managedFields(spec);

  // 實際表頭 -> 欄位，用來判斷某一欄該不該改名
  const fieldByHeader = new Map<string, F>();
  for (const field of managed) {
    const header = map[field];
    if (header) fieldByHeader.set(header, field);
  }

  const renamed = headers.map((header) => {
    const field = fieldByHeader.get(header);
    return field ? spec.labels[field] : header;
  });

  const missing = managed.filter((f) => !map[f]);
  // 萬一表裡同時有「coverUrl」和「封面網址」，改名會撞成兩個同名欄，
  // 那就別改名了，只補缺的欄，交給使用者自己決定要留哪一個
  const safeToRename = new Set(renamed).size === renamed.length;
  const base = safeToRename ? renamed : headers;
  //
  // 一律補在最右邊，不要試著插在「它應該在」的位置：setHeaderRow 只重寫表頭
  // 那一列，底下的資料不會跟著右移，在中間插一欄會讓右邊每一欄都對錯資料。
  // 想調欄位順序請直接在 Sheet 上整欄搬移，app 是靠表頭名字對應的，位置不影響。
  //
  const nextHeaders = [...base, ...missing.map((f) => spec.labels[f])];

  const changed =
    nextHeaders.length !== headers.length || nextHeaders.some((h, i) => h !== headers[i]);

  if (!changed) return assertComplete(spec, map);

  await sheet.setHeaderRow(nextHeaders);
  return assertComplete(spec, mapHeaders(spec, nextHeaders));
}

/**
 * 每個欄位都必須對應得到表頭。少一個就代表 COLUMN_LABELS 與 COLUMN_ALIASES 沒對上，
 * 這時候硬跑下去會拿 undefined 去定位儲存格，寫壞使用者的資料——寧可直接失敗。
 */
function assertComplete<F extends string, L extends F>(
  spec: TableSpec<F, L>,
  map: Partial<Record<F, string>>,
): ColumnMap<F, L> {
  const missing = managedFields(spec).filter((f) => !map[f]);
  if (missing.length > 0) {
    throw new Error(`「${spec.title}」表頭對應不完整，缺少：${missing.join(", ")}`);
  }
  return map as ColumnMap<F, L>;
}

/** 只砍掉尾端的空欄，中間的空欄要留著，不然整排資料會左移對不上 */
function trimTrailingBlanks(headers: string[]): string[] {
  let end = headers.length;
  while (end > 0 && !headers[end - 1]?.trim()) end--;
  return headers.slice(0, end);
}

/** ColumnMap 是交集型別，用泛型欄位去索引 TS 認不出來，統一從這裡取 */
function headerOf<F extends string, L extends F>(
  columns: ColumnMap<F, L>,
  field: F,
): string | undefined {
  return (columns as Partial<Record<F, string>>)[field];
}

/** 表頭字串 -> 欄索引（0 起算），批次寫入時用來定位儲存格 */
function headerIndex(sheet: GoogleSpreadsheetWorksheet): Record<string, number> {
  const index: Record<string, number> = {};
  sheet.headerValues.forEach((header, i) => {
    index[header] = i;
  });
  return index;
}

/** 分頁不存在就現開一張。任何一張以 spec 描述的表都走這裡 */
async function getTableSheet<F extends string, L extends F>(
  sheetId: string,
  accessToken: string,
  spec: TableSpec<F, L>,
) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  // 舊名字也要找一遍，不然分頁改過名就會多開一張空表
  let sheet = [spec.title, ...(spec.titleAliases ?? [])]
    .map((title) => doc.sheetsByTitle[title])
    .find(Boolean);
  if (!sheet) {
    sheet = await doc.addSheet({ title: spec.title, headerValues: defaultHeaders(spec) });
  }
  const columns = await resolveColumns(sheet, spec);
  return { sheet, columns };
}

const getBooksSheet = (sheetId: string, accessToken: string) =>
  getTableSheet(sheetId, accessToken, BOOK_TABLE);

/**
 * 讀出一張表的原始字串值，順便補上沒有編號的列。
 *
 * 只負責「表 -> 字串」，欄位的語意（狀態怎麼推、平台怎麼收斂）留給呼叫端，
 * 那些是各媒介自己的事。
 */
async function listTableValues<F extends string, L extends F>(
  sheetId: string,
  accessToken: string,
  spec: TableSpec<F, L>,
): Promise<{ values: Record<F, string>[]; idsBackfilled: number }> {
  const { sheet, columns } = await getTableSheet(sheetId, accessToken, spec);
  let rows = await sheet.getRows();

  const idHeader = headerOf(columns, spec.idField) ?? spec.labels[spec.idField];
  const rowsMissingId = rows.filter((row) => !row.get(idHeader));
  if (rowsMissingId.length > 0) {
    // 一列一次 row.save() 會打爆 Google Sheets 的每分鐘寫入配額，改成一次批次寫入
    await sheet.loadCells();
    const idColumn = headerIndex(sheet)[idHeader];
    for (const row of rowsMissingId) {
      sheet.getCell(row.rowNumber - 1, idColumn).value = crypto.randomUUID();
    }
    await sheet.saveUpdatedCells();

    // re-read so we return the ids that were actually persisted, avoiding a
    // mismatch if a concurrent call backfilled the same rows with different ids
    rows = await sheet.getRows();
  }

  const values = rows.map((row) => {
    const value = {} as Record<F, string>;
    for (const field of spec.fields) {
      value[field] = (row.get(headerOf(columns, field) ?? "") ?? "").toString().trim();
    }
    return value;
  });

  return { values, idsBackfilled: rowsMissingId.length };
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
  const { values, idsBackfilled } = await listTableValues(sheetId, accessToken, BOOK_TABLE);

  const books = values.map((v) => ({
    ...v,
    // 大小寫不同一律收斂成正式名稱（HyRead／hyread）；
    // 認不得的就照原樣留著——平台已經是使用者可自訂的選項了
    platform: normalizePlatform(v.platform) ?? v.platform ?? "",
    // 舊資料沒有這欄，用日期推一個合理的預設值
    status: normalizeStatus(v.status) ?? inferStatus(v.startDate || null, v.endDate || null),
    startDate: v.startDate || null,
    endDate: v.endDate || null,
  }));

  return { books, idsBackfilled };
}

export async function listArticles(sheetId: string, accessToken: string): Promise<Article[]> {
  const { values } = await listTableValues(sheetId, accessToken, ARTICLE_TABLE);
  return values.map((v) => ({ ...v, endDate: v.endDate || null }));
}

export async function addArticleRow(sheetId: string, accessToken: string, article: Article) {
  await addTableRow(sheetId, accessToken, ARTICLE_TABLE, article);
}

export async function updateArticleRow(
  sheetId: string,
  accessToken: string,
  id: string,
  patch: Partial<Article>,
) {
  await updateTableRow(sheetId, accessToken, ARTICLE_TABLE, id, patch);
}

export async function deleteArticleRow(sheetId: string, accessToken: string, id: string) {
  await deleteTableRow(sheetId, accessToken, ARTICLE_TABLE, id);
}

export async function listEntries(sheetId: string, accessToken: string): Promise<Entry[]> {
  const { values } = await listTableValues(sheetId, accessToken, ENTRY_TABLE);
  return values.map((v) => ({ ...v, date: v.date || null }));
}

export async function addEntryRow(sheetId: string, accessToken: string, entry: Entry) {
  await addTableRow(sheetId, accessToken, ENTRY_TABLE, entry);
}

export async function updateEntryRow(
  sheetId: string,
  accessToken: string,
  id: string,
  patch: Partial<Entry>,
) {
  await updateTableRow(sheetId, accessToken, ENTRY_TABLE, id, patch);
}

export async function deleteEntryRow(sheetId: string, accessToken: string, id: string) {
  await deleteTableRow(sheetId, accessToken, ENTRY_TABLE, id);
}

/** 一次寫入多筆紀事。搬移舊心得時一次幾十列，逐列寫會撞到寫入配額 */
export async function addEntryRows(sheetId: string, accessToken: string, entries: Entry[]) {
  if (entries.length === 0) return;
  const { sheet, columns } = await getTableSheet(sheetId, accessToken, ENTRY_TABLE);

  await sheet.addRows(
    entries.map((entry) => {
      const raw: Record<string, string> = {};
      for (const field of managedFields(ENTRY_TABLE)) {
        raw[columns[field] ?? ENTRY_TABLE.labels[field]] = entry[field] ?? "";
      }
      return raw;
    }),
  );
}

export async function listMetrics(sheetId: string, accessToken: string): Promise<Metric[]> {
  const { values } = await listTableValues(sheetId, accessToken, METRIC_TABLE);
  return values;
}

/** 每次量測都是新的一列，不覆蓋舊的——累積起來就是成長曲線 */
export async function addMetricRow(sheetId: string, accessToken: string, metric: Metric) {
  await addTableRow(sheetId, accessToken, METRIC_TABLE, metric);
}

async function addTableRow<F extends string, L extends F>(
  sheetId: string,
  accessToken: string,
  spec: TableSpec<F, L>,
  item: Partial<Record<F, string | null>>,
) {
  const { sheet, columns } = await getTableSheet(sheetId, accessToken, spec);
  const raw: Record<string, string> = {};
  for (const field of managedFields(spec)) {
    raw[headerOf(columns, field) ?? spec.labels[field]] = item[field] ?? "";
  }
  await sheet.addRow(raw);
}

async function findRow<F extends string, L extends F>(
  sheet: GoogleSpreadsheetWorksheet,
  columns: ColumnMap<F, L>,
  spec: TableSpec<F, L>,
  id: string,
) {
  const rows = await sheet.getRows();
  const idHeader = headerOf(columns, spec.idField) ?? spec.labels[spec.idField];
  return rows.find((r) => r.get(idHeader) === id);
}

async function updateTableRow<F extends string, L extends F>(
  sheetId: string,
  accessToken: string,
  spec: TableSpec<F, L>,
  id: string,
  patch: Partial<Record<F, string | null>>,
) {
  const { sheet, columns } = await getTableSheet(sheetId, accessToken, spec);
  const row = await findRow(sheet, columns, spec, id);
  if (!row) throw new Error(`在「${spec.title}」找不到這筆紀錄`);

  for (const [key, value] of Object.entries(patch)) {
    const header = headerOf(columns, key as F);
    if (header) row.set(header, value ?? "");
  }
  await row.save();
}

async function deleteTableRow<F extends string, L extends F>(
  sheetId: string,
  accessToken: string,
  spec: TableSpec<F, L>,
  id: string,
) {
  const { sheet, columns } = await getTableSheet(sheetId, accessToken, spec);
  const row = await findRow(sheet, columns, spec, id);
  if (row) await row.delete();
}

export async function addBookRow(sheetId: string, accessToken: string, book: Book) {
  await addTableRow(sheetId, accessToken, BOOK_TABLE, book);
}

export async function updateBookRow(
  sheetId: string,
  accessToken: string,
  id: string,
  patch: Partial<Book>,
) {
  await updateTableRow(sheetId, accessToken, BOOK_TABLE, id, patch);
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
      const header = columns[key as BookField];
      const column = header ? index[header] : undefined;
      if (column === undefined) continue;
      sheet.getCell(row.rowNumber - 1, column).value = value ?? "";
      written++;
    }
  }

  await sheet.saveUpdatedCells();
  return written;
}

export async function deleteBookRow(sheetId: string, accessToken: string, id: string) {
  await deleteTableRow(sheetId, accessToken, BOOK_TABLE, id);
}

const KEYWORDS_SHEET_TITLE = "關鍵字";
const KEYWORD_HEADERS = ["名稱", "領域", "座標", "起訖", "維基連結", "摘要"];

/** 這一欄本來叫「學科」；就地改標題，值不動，舊表打開就自己換過去 */
const RENAMED_HEADERS: Record<string, string> = { 學科: "領域" };

async function getKeywordsSheet(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[KEYWORDS_SHEET_TITLE];
  if (!sheet) {
    return doc.addSheet({ title: KEYWORDS_SHEET_TITLE, headerValues: KEYWORD_HEADERS });
  }

  // 只改標題那一列：欄的位置與底下的值都不動，所以不會有任何一格跑掉
  await sheet.loadHeaderRow().catch(() => {});
  const headers = sheet.headerValues ?? [];
  const renamed = headers.map((header) => RENAMED_HEADERS[header] ?? header);
  if (renamed.some((header, i) => header !== headers[i])) await sheet.setHeaderRow(renamed);

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
      topics: (row.get("領域") ?? row.get("學科") ?? "").toString().trim(),
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

/** 刪掉主檔那一列，並把所有書的關鍵字欄裡的這個名字一起拿掉。回傳動到幾本書 */
export async function deleteKeyword(
  sheetId: string,
  accessToken: string,
  name: string,
): Promise<number> {
  const sheet = await getKeywordsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => (r.get("名稱") ?? "").toString().trim() === name);
  if (row) await row.delete();

  const books = await listBooks(sheetId, accessToken);
  const patches = new Map<string, Partial<Book>>();
  for (const book of books) {
    const lines = splitLines(book.keywords);
    if (!lines.includes(name)) continue;
    patches.set(book.id, { keywords: lines.filter((line) => line !== name).join("\n") });
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
    領域: info.topics,
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
  // 後來才加的欄位接在最後：既有的表是就地補欄，插在中間會讓整排值錯位
  "讀音",
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
  if (!sheet) return doc.addSheet({ title, headerValues });

  // 後來新增的欄位要補到既有的表上，否則寫進去的值會被當成不存在的欄丟掉
  await sheet.loadHeaderRow().catch(() => {});
  const current = sheet.headerValues ?? [];
  const missing = headerValues.filter((header) => !current.includes(header));
  if (missing.length > 0) await sheet.setHeaderRow([...current, ...missing]);

  return sheet;
}

function text(row: GoogleSpreadsheetRow, header: string): string {
  return (row.get(header) ?? "").toString().trim();
}

/**
 * 補上沒有編號的列。
 *
 * 手動在 Sheet 上加一列、或是早期搬移留下來的列都可能沒有編號，
 * 而編輯是靠編號認人的——沒有編號那一列就改不動。
 *
 * 一列一次 row.save() 會打爆 Google Sheets 的每分鐘寫入配額，改成一次批次寫入。
 */
async function backfillIds(sheet: GoogleSpreadsheetWorksheet, rows: GoogleSpreadsheetRow[]) {
  const missing = rows.filter((row) => !text(row, "編號"));
  if (missing.length === 0) return rows;

  await sheet.loadCells();
  const column = headerIndex(sheet)["編號"];
  if (column === undefined) return rows;

  for (const row of missing) {
    sheet.getCell(row.rowNumber - 1, column).value = crypto.randomUUID();
  }
  await sheet.saveUpdatedCells();

  // 重讀一次，回傳的才是真的寫進去的那些編號
  return sheet.getRows();
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
  const rows = await backfillIds(sheet, await sheet.getRows());

  return rows
    .map((row) => ({
      id: text(row, "編號"),
      bookId: text(row, "書籍編號"),
      bookTitle: text(row, "書名"),
      word: text(row, "詞"),
      pronunciation: text(row, "讀音"),
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
  const rows = await backfillIds(sheet, await sheet.getRows());

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
        讀音: item.pronunciation,
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

// ---------------------------------------------------------------------------
// 設定
//
// 一張「鍵、值」的小表，放 app 層的設定。目前只有私人項目的密碼雜湊——
// 存在 Sheet 上換裝置才通用，這是使用者選的（見 /api/privacy）。
// ---------------------------------------------------------------------------

const SETTINGS_SHEET_TITLE = "設定";
const SETTINGS_HEADERS = ["設定", "值"];

async function getSettingsSheet(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[SETTINGS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SETTINGS_SHEET_TITLE, headerValues: SETTINGS_HEADERS });
  }
  return sheet;
}

export async function readSetting(
  sheetId: string,
  accessToken: string,
  key: string,
): Promise<string> {
  const sheet = await getSettingsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => (r.get("設定") ?? "").toString().trim() === key);
  return (row?.get("值") ?? "").toString().trim();
}

/** 值是空字串就把那一列刪掉，Sheet 上不留一列空設定 */
export async function writeSetting(
  sheetId: string,
  accessToken: string,
  key: string,
  value: string,
) {
  const sheet = await getSettingsSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => (r.get("設定") ?? "").toString().trim() === key);

  if (!value) {
    if (row) await row.delete();
    return;
  }
  if (row) {
    row.set("值", value);
    await row.save();
    return;
  }
  await sheet.addRow({ 設定: key, 值: value });
}

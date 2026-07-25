import { GoogleSpreadsheet } from "google-spreadsheet";
import { OAuth2Client } from "google-auth-library";
import { Book } from "@/types/book";

const BOOKS_SHEET_TITLE = "書籍";

const BOOK_HEADERS: (keyof Book)[] = [
  "id",
  "title",
  "author",
  "isbn",
  "coverUrl",
  "publisher",
  "platform",
  "sourceUrl",
  "startDate",
  "endDate",
  "domain",
  "type",
  "language",
  "note",
];

function getAuthClient(accessToken: string) {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

async function getBooksSheet(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[BOOKS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: BOOKS_SHEET_TITLE,
      headerValues: BOOK_HEADERS,
    });
  }
  return sheet;
}

export async function verifySheetAccess(sheetId: string, accessToken: string) {
  const doc = new GoogleSpreadsheet(sheetId, getAuthClient(accessToken));
  await doc.loadInfo();
  return { title: doc.title };
}

export async function listBooks(sheetId: string, accessToken: string): Promise<Book[]> {
  const sheet = await getBooksSheet(sheetId, accessToken);
  let rows = await sheet.getRows();

  const rowsMissingId = rows.filter((row) => !row.get("id"));
  if (rowsMissingId.length > 0) {
    for (const row of rowsMissingId) {
      row.set("id", crypto.randomUUID());
    }
    await sheet.saveUpdatedCells();
    // re-read so we return the ids that were actually persisted, avoiding a
    // mismatch if a concurrent call backfilled the same rows with different ids
    rows = await sheet.getRows();
  }

  return rows.map((row) => ({
    id: row.get("id") ?? "",
    title: row.get("title") ?? "",
    author: row.get("author") ?? "",
    isbn: row.get("isbn") ?? "",
    coverUrl: row.get("coverUrl") ?? "",
    publisher: row.get("publisher") ?? "",
    platform: row.get("platform") ?? "其他",
    sourceUrl: row.get("sourceUrl") ?? "",
    startDate: row.get("startDate") || null,
    endDate: row.get("endDate") || null,
    domain: row.get("domain") ?? "",
    type: row.get("type") ?? "",
    language: row.get("language") ?? "",
    note: row.get("note") ?? "",
  }));
}

export async function addBookRow(sheetId: string, accessToken: string, book: Book) {
  const sheet = await getBooksSheet(sheetId, accessToken);
  await sheet.addRow({ ...book, startDate: book.startDate ?? "", endDate: book.endDate ?? "" });
}

export async function updateBookRow(
  sheetId: string,
  accessToken: string,
  id: string,
  patch: Partial<Book>
) {
  const sheet = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("id") === id);
  if (!row) throw new Error("找不到這筆書籍紀錄");

  for (const [key, value] of Object.entries(patch)) {
    row.set(key, value ?? "");
  }
  await row.save();
}

export async function deleteBookRow(sheetId: string, accessToken: string, id: string) {
  const sheet = await getBooksSheet(sheetId, accessToken);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("id") === id);
  if (!row) return;
  await row.delete();
}

import { drizzle } from "drizzle-orm/postgres-js";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import postgres from "postgres";
import {
  articleKeywords,
  bookKeywords,
  writingKeywords,
} from "../../src/lib/db/schema/keyword-links";
import { articles, books, readings } from "../../src/lib/db/schema/reading";
import { quotes, vocabulary } from "../../src/lib/db/schema/records";
import { attributes, bookTypes, keywords, writingTypes } from "../../src/lib/db/schema/taxonomy";
import { writings } from "../../src/lib/db/schema/writing";
import {
  ARTICLE_TABLE,
  BOOK_TABLE,
  mapHeaders,
  TableSpec,
  WRITING_TABLE,
} from "../../src/lib/sheet-schema";
import { Article } from "../../src/types/article";
import { Book, splitLines } from "../../src/types/book";
import { Writing } from "../../src/types/writing";
import { groupBooks } from "../../src/utils/migration/group-books";
import {
  distinctValues,
  toArticle,
  toBookAndReadings,
  toWriting,
  typeNodes,
} from "../../src/utils/migration/to-rows";

/**
 * Sheet 倒進 Postgres。整段包在一個 transaction 裡，中途出錯就什麼都不寫。
 *
 * 預設寫本地那份；要寫雲端請自己給 MIGRATE_DATABASE_URL。
 * 重跑之前先清空，不然會疊上去——這支不做 upsert，它只負責搬一次。
 */

// 預設寫本地。要寫雲端得自己給 MIGRATE_DATABASE_URL，不會誤用 app 的 DATABASE_URL
const url =
  process.env.MIGRATE_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
console.log(`寫入 ${url.includes("127.0.0.1") ? "本地" : "雲端"} 資料庫`);

const auth = new JWT({
  email: process.env.GOOGLE_SA_EMAIL,
  key: process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const doc = new GoogleSpreadsheet(process.env.MIGRATE_SHEET_ID!, auth);
await doc.loadInfo();

function toRecords<F extends string>(
  spec: TableSpec<F, F>,
  rows: GoogleSpreadsheetRow[],
  headers: string[],
) {
  const map = mapHeaders(spec, headers);
  return rows.map((row) => {
    const item = {} as Record<F, string>;
    for (const field of spec.fields) {
      const header = map[field];
      item[field] = header ? String(row.get(header) ?? "") : "";
    }
    return item;
  });
}

async function load<F extends string>(spec: TableSpec<F, F>) {
  const sheet = doc.sheetsByTitle[spec.title];
  const rows = await sheet.getRows();
  return toRecords(spec, rows, sheet.headerValues);
}

/** 佳句、單字、關鍵字沒有 TableSpec，直接照中文表頭讀 */
async function loadRaw(title: string) {
  const sheet = doc.sheetsByTitle[title];
  const rows = await sheet.getRows();
  return rows.map((row) =>
    Object.fromEntries(sheet.headerValues.map((h) => [h, String(row.get(h) ?? "")])),
  );
}

const bookRows = (await load(
  BOOK_TABLE as unknown as TableSpec<keyof Book & string, never>,
)) as unknown as Book[];
const articleRows = (await load(
  ARTICLE_TABLE as unknown as TableSpec<keyof Article & string, never>,
)) as unknown as Article[];
const writingRows = (await load(
  WRITING_TABLE as unknown as TableSpec<keyof Writing & string, never>,
)) as unknown as Writing[];
const quoteRaw = await loadRaw("佳句");
const vocabRaw = await loadRaw("單字");
const keywordRaw = await loadRaw("關鍵字");

const sql = postgres(url, { prepare: false });
const db = drizzle(sql);

await db.transaction(async (tx) => {
  // ── 類型樹：父節點先進去，子節點才連得上
  const nodes = typeNodes([...bookRows, ...articleRows]);
  const typeIds = new Map<string, string>();
  for (const node of nodes) {
    const [row] = await tx
      .insert(bookTypes)
      .values({ name: node.name, parentId: node.parent ? typeIds.get(node.parent) : null })
      .returning({ id: bookTypes.id });
    typeIds.set(node.name, row.id);
  }

  // ── 屬性
  const attrNames = distinctValues(
    [...bookRows, ...articleRows].flatMap((r) => splitLines(r.type)),
  );
  const attrIds = new Map<string, string>();
  for (const name of attrNames) {
    const [row] = await tx.insert(attributes).values({ name }).returning({ id: attributes.id });
    attrIds.set(name, row.id);
  }

  // ── 書寫的類型（去掉「書籍」「文章」那種出處值）
  const writingTypeNames = distinctValues(writingRows.map((w) => toWriting(w).typeName));
  const writingTypeIds = new Map<string, string>();
  for (const name of writingTypeNames) {
    const [row] = await tx.insert(writingTypes).values({ name }).returning({ id: writingTypes.id });
    writingTypeIds.set(name, row.id);
  }

  // ── 關鍵字主檔。主檔沒收錄但被引用的字也要補進去，不然關聯表插不了
  const used = distinctValues([
    ...bookRows.flatMap((b) => splitLines(b.keywords)),
    ...articleRows.flatMap((a) => splitLines(a.keywords)),
    ...writingRows.flatMap((w) => splitLines(w.keywords)),
  ]);
  const known = new Map(keywordRaw.map((k) => [k["名稱"].trim(), k]));
  for (const name of used) {
    const info = known.get(name);
    await tx.insert(keywords).values({
      name,
      topics: info?.["領域"] ?? "", // 維基的主題分類，跟書籍的「領域」是不同的東西
      coordinates: info?.["座標"] ?? "",
      span: info?.["起訖"] ?? "",
      wikiUrl: info?.["維基連結"] ?? "",
      summary: info?.["摘要"] ?? "",
    });
  }

  // ── 書與閱讀。Sheet 上的舊列編號要能對回新的 book id，佳句單字心得都靠它
  const bookIdByOldId = new Map<string, string>();
  for (const group of groupBooks(bookRows)) {
    const { book, readings: reads } = toBookAndReadings(group);
    const [row] = await tx
      .insert(books)
      .values({
        title: book.title,
        author: book.author,
        language: book.language,
        typeId: typeIds.get(book.typeName) ?? null,
        attributeId: attrIds.get(book.attributeName) ?? null,
      })
      .returning({ id: books.id });

    for (const old of group.rows) bookIdByOldId.set(old.id, row.id);
    for (const read of reads) await tx.insert(readings).values({ ...read, bookId: row.id });
    for (const keyword of book.keywords)
      await tx.insert(bookKeywords).values({ bookId: row.id, keyword });
  }

  // ── 文章
  const articleIdByOldId = new Map<string, string>();
  for (const old of articleRows) {
    const article = toArticle(old);
    const [row] = await tx
      .insert(articles)
      .values({
        title: article.title,
        author: article.author,
        platform: article.platform,
        sourceUrl: article.sourceUrl,
        endDate: article.endDate,
        language: article.language,
        typeId: typeIds.get(article.typeName) ?? null,
        attributeId: attrIds.get(article.attributeName) ?? null,
        isPrivate: article.isPrivate,
      })
      .returning({ id: articles.id });
    articleIdByOldId.set(old.id, row.id);
    for (const keyword of article.keywords)
      await tx.insert(articleKeywords).values({ articleId: row.id, keyword });
  }

  // ── 書寫。出處指回書或文章，兩個互斥
  const writingIdByOldId = new Map<string, string>();
  for (const old of writingRows) {
    const writing = toWriting(old);
    const bookId = bookIdByOldId.get(writing.sourceId) ?? null;
    const [row] = await tx
      .insert(writings)
      .values({
        title: writing.title,
        note: writing.note,
        date: writing.date,
        link: writing.link,
        typeId: writingTypeIds.get(writing.typeName) ?? null,
        isPrivate: writing.isPrivate,
        bookId,
        articleId: bookId ? null : (articleIdByOldId.get(writing.sourceId) ?? null),
      })
      .returning({ id: writings.id });
    writingIdByOldId.set(old.id, row.id);
    for (const keyword of writing.keywords)
      await tx.insert(writingKeywords).values({ writingId: row.id, keyword });
  }

  // ── 佳句與單字。指向書而不是某一次讀；認不出來的留空，不要整筆丟掉
  for (const raw of quoteRaw) {
    await tx.insert(quotes).values({
      bookId: bookIdByOldId.get(raw["書籍編號"].trim()) ?? null,
      text: raw["佳句"],
      chapter: raw["章節"],
      note: raw["心得"],
    });
  }
  for (const raw of vocabRaw) {
    await tx.insert(vocabulary).values({
      bookId: bookIdByOldId.get(raw["書籍編號"].trim()) ?? null,
      word: raw["詞"],
      pronunciation: raw["讀音"],
      wordTranslation: raw["詞翻譯"],
      sentence: raw["例句"],
      sentenceTranslation: raw["例句翻譯"],
      chapter: raw["章節"],
      language: raw["語言"],
    });
  }

  console.log(`
  類型      ${nodes.length}
  屬性      ${attrNames.length}
  書寫類型  ${writingTypeNames.length}
  關鍵字    ${used.length}
  書        ${new Set(bookIdByOldId.values()).size}（${bookRows.length} 次閱讀）
  文章      ${articleIdByOldId.size}
  書寫      ${writingIdByOldId.size}
  佳句      ${quoteRaw.length}
  單字      ${vocabRaw.length}`);
});

await sql.end();
console.log("\n完成");

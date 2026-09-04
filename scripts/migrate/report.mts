import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { BOOK_TABLE, mapHeaders, TableSpec, WRITING_TABLE } from "../../src/lib/sheet-schema";
import { Book, splitLines } from "../../src/types/book";
import { Writing } from "../../src/types/writing";
import { groupBooks } from "../../src/utils/migration/group-books";

/**
 * 匯入前的偵察報告。只讀不寫。
 *
 * 歸戶靠書名比對，那是猜的——猜錯就會把兩本書併成一本，而且併完看不出來。
 * 所以先把「我打算怎麼歸」印出來給人看過，確認了才真的寫進資料庫。
 */

const auth = new JWT({
  email: process.env.GOOGLE_SA_EMAIL,
  key: process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const doc = new GoogleSpreadsheet(process.env.MIGRATE_SHEET_ID!, auth);
await doc.loadInfo();

/** 照 spec 的別名把一列還原成程式看得懂的形狀，欄名改過也讀得到 */
function toRecord<F extends string>(
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
  return toRecord(spec, rows, sheet.headerValues);
}

const line = (s = "") => console.log(s);
const rule = (title: string) =>
  line(`\n${"─".repeat(4)} ${title} ${"─".repeat(40 - title.length)}`);

rule("各分頁實際列數");
for (const sheet of doc.sheetsByIndex) {
  const rows = await sheet.getRows();
  line(`  ${sheet.title.padEnd(6)} ${String(rows.length).padStart(5)} 列`);
}

const bookRows = (await load(
  BOOK_TABLE as unknown as TableSpec<keyof Book & string, never>,
)) as unknown as Book[];
const groups = groupBooks(bookRows);
const reread = groups.filter((g) => g.rows.length > 1);

rule("書籍歸戶");
line(`  ${bookRows.length} 列  →  ${groups.length} 本書、${bookRows.length} 次閱讀`);
line(`  其中 ${reread.length} 本讀過不只一次`);

if (reread.length) {
  rule("被判定為同一本的組（請確認沒有誤併）");
  for (const g of reread) {
    line(`\n  ${g.primary.title}`);
    for (const row of g.rows) {
      const origin = row.originId ? "originId" : "書名比對";
      line(`    ${(row.startDate || "無日期").padEnd(12)} ${row.platform.padEnd(8)} ${origin}`);
      if (row.title !== g.primary.title) line(`      書名不同：${row.title}`);
    }
  }
}

rule("類型樹（原領域／次領域）");
const tree = new Map<string, Set<string>>();
for (const b of bookRows) {
  const domain = b.domain.trim() || "（沒填）";
  tree.set(domain, (tree.get(domain) ?? new Set()).add(b.subDomain.trim()));
}
for (const [domain, subs] of [...tree].sort()) {
  const children = [...subs].filter(Boolean).sort();
  line(`  ${domain}${children.length ? `  →  ${children.join("、")}` : ""}`);
}

rule("屬性（要改成單選）");
const attrCounts = new Map<string, number>();
const multi: string[] = [];
for (const b of bookRows) {
  const values = splitLines(b.type);
  if (values.length > 1) multi.push(`${b.title}：${values.join("、")}`);
  for (const v of values) attrCounts.set(v, (attrCounts.get(v) ?? 0) + 1);
}
line(
  `  用過的值：${[...attrCounts]
    .sort((a, b) => b[1] - a[1])
    .map(([v, n]) => `${v}(${n})`)
    .join("、")}`,
);
line(`  同時填多個的有 ${multi.length} 筆${multi.length ? "：" : ""}`);
multi.slice(0, 20).forEach((m) => line(`    ${m}`));

rule("關鍵字");
const kw = new Map<string, number>();
for (const b of bookRows) for (const k of splitLines(b.keywords)) kw.set(k, (kw.get(k) ?? 0) + 1);
line(
  `  書籍用過 ${kw.size} 個不同的關鍵字，共 ${[...kw.values()].reduce((a, b) => a + b, 0)} 次掛載`,
);

line();

const writingRows = (await load(
  WRITING_TABLE as unknown as TableSpec<keyof Writing & string, never>,
)) as unknown as Writing[];

rule("書寫的關鍵字（要變成單選的類型）");
const perWriting = writingRows.map((w) => splitLines(w.keywords));
const multiWriting = perWriting.filter((v) => v.length > 1).length;
const emptyWriting = perWriting.filter((v) => v.length === 0).length;
const writingKw = new Map<string, number>();
for (const values of perWriting)
  for (const v of values) writingKw.set(v, (writingKw.get(v) ?? 0) + 1);
line(`  ${writingRows.length} 則：${multiWriting} 則填了多個、${emptyWriting} 則沒填`);
line(
  `  用過的值：${[...writingKw]
    .sort((a, b) => b[1] - a[1])
    .map(([v, n]) => `${v}(${n})`)
    .join("、")}`,
);

rule("書寫的出處");
const linked = writingRows.filter((w) => w.sourceId.trim()).length;
line(`  ${linked} 則有出處（心得），${writingRows.length - linked} 則沒有`);

rule("書寫的舊「類型」欄");
const kinds = new Map<string, number>();
for (const w of writingRows)
  kinds.set(w.kind.trim() || "（沒填）", (kinds.get(w.kind.trim() || "（沒填）") ?? 0) + 1);
line(
  `  ${[...kinds]
    .sort((a, b) => b[1] - a[1])
    .map(([v, n]) => `${v}(${n})`)
    .join("、")}`,
);
line();

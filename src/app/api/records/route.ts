import { NextRequest, NextResponse } from "next/server";
import { readOnly, requireSession, requireWriter } from "@/app/api/_lib/respond";
import {
  addQuote,
  addVocabulary,
  relinkFragment,
  replaceBookQuotes,
  replaceBookVocabulary,
} from "@/lib/db/mutations/fragments";
import { listBooks } from "@/lib/db/queries/books";
import { listQuoteRows, listVocabularyRows } from "@/lib/db/queries/fragments";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { isPrivate, requestPrivacy } from "@/utils/privacy";

/** 單字與佳句是同一種東西的兩張表，讀寫走同一條路，用 kind 分流 */
type Kind = "vocabulary" | "quotes";

function isKind(value: string | null): value is Kind {
  return value === "vocabulary" || value === "quotes";
}

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  try {
    const [vocabulary, quotes, privacy] = await Promise.all([
      listVocabularyRows(session.user.id),
      listQuoteRows(session.user.id),
      requestPrivacy(session.user.id, req),
    ]);
    if (privacy.unlocked) return NextResponse.json({ vocabulary, quotes });

    // 佳句與單字自己沒有私人欄，但它們屬於某一本書——那本書私人，它們就跟著藏起來
    const books = await listBooks(session.user.id);
    const hidden = new Set(
      books.filter((book) => isPrivate(book, privacy.options)).map((b) => b.id),
    );
    return NextResponse.json({
      vocabulary: vocabulary.filter((row) => !hidden.has(row.bookId)),
      quotes: quotes.filter((row) => !hidden.has(row.bookId)),
    });
  } catch (err) {
    console.error("listRecords failed:", err);
    return NextResponse.json({ error: "讀取單字與佳句失敗" }, { status: 502 });
  }
}

/**
 * 一列新增。PUT 是以書為單位整批取代，沒有書就沒有那個單位——
 * 不掛書的單字與佳句只能走這裡。bookId 可以是空字串。
 */
export async function POST(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return readOnly();

  const { kind, bookId, row } = (await req.json()) as {
    kind: Kind;
    bookId?: string;
    row: VocabularyRow | QuoteRow;
  };
  if (!isKind(kind) || !row) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    const userId = session.user.id;
    if (kind === "vocabulary") await addVocabulary(userId, bookId ?? "", row as VocabularyRow);
    else await addQuote(userId, bookId ?? "", row as QuoteRow);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("addRecord failed:", err);
    return NextResponse.json({ error: "儲存失敗" }, { status: 502 });
  }
}

/** 一本書的紀錄整批換掉。前端本來就握有那本書的完整清單，逐列比對只是自找麻煩 */
export async function PUT(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return readOnly();

  const { kind, bookId, rows } = (await req.json()) as {
    kind: Kind;
    bookId: string;
    rows: VocabularyRow[] | QuoteRow[];
  };
  if (!isKind(kind) || !bookId || !Array.isArray(rows)) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    const userId = session.user.id;
    if (kind === "vocabulary") await replaceBookVocabulary(userId, bookId, rows as VocabularyRow[]);
    else await replaceBookQuotes(userId, bookId, rows as QuoteRow[]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("replaceBookRecords failed:", err);
    return NextResponse.json({ error: "儲存失敗" }, { status: 502 });
  }
}

/** 把一筆既有的佳句／單字改連到另一本書；bookId 空字串是拔掉出處 */
export async function PATCH(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return readOnly();

  const { id, bookId } = (await req.json()) as { id: string; bookId: string };
  if (!id) return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });

  try {
    await relinkFragment(session.user.id, id, bookId ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("relinkFragment failed:", err);
    return NextResponse.json({ error: "更新失敗" }, { status: 502 });
  }
}

export const maxDuration = 30;

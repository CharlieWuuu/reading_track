import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listBooks,
  listQuoteRows,
  listVocabularyRows,
  replaceBookQuotes,
  replaceBookVocabulary,
} from "@/lib/sheets";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { isPrivate, requestPrivacy } from "@/utils/privacy";

/** 單字與佳句是同一種東西的兩張表，讀寫走同一條路，用 kind 分流 */
type Kind = "vocabulary" | "quotes";

function isKind(value: string | null): value is Kind {
  return value === "vocabulary" || value === "quotes";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    const [vocabulary, quotes, privacy] = await Promise.all([
      listVocabularyRows(sheetId, session.accessToken),
      listQuoteRows(sheetId, session.accessToken),
      requestPrivacy(req, sheetId, session.accessToken),
    ]);
    if (privacy.unlocked) return NextResponse.json({ vocabulary, quotes });

    // 佳句與單字自己沒有私人欄，但它們屬於某一本書——那本書私人，它們就跟著藏起來
    const books = await listBooks(sheetId, session.accessToken);
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

/** 一本書的紀錄整批換掉。前端本來就握有那本書的完整清單，逐列比對只是自找麻煩 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, kind, bookId, bookTitle, rows } = (await req.json()) as {
    sheetId: string;
    kind: Kind;
    bookId: string;
    bookTitle: string;
    rows: VocabularyRow[] | QuoteRow[];
  };
  if (!sheetId || !isKind(kind) || !bookId || !Array.isArray(rows)) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    if (kind === "vocabulary") {
      await replaceBookVocabulary(
        sheetId,
        session.accessToken,
        bookId,
        bookTitle ?? "",
        rows as VocabularyRow[],
      );
    } else {
      await replaceBookQuotes(
        sheetId,
        session.accessToken,
        bookId,
        bookTitle ?? "",
        rows as QuoteRow[],
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("replaceBookRecords failed:", err);
    return NextResponse.json({ error: "儲存失敗" }, { status: 502 });
  }
}

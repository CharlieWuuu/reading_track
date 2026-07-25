import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listBooks, updateBookRow } from "@/lib/sheets";
import {
  BookLookupError,
  fetchBookMetadata,
  mergeEnrichment,
  needsEnrichment,
} from "@/lib/enrichBook";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { sheetId } = (await req.json()) as { sheetId: string };
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  const books = await listBooks(sheetId, session.accessToken);
  const candidates = books.filter((b) => b.title && needsEnrichment(b));

  let updated = 0;
  let skipped = 0;

  for (const [i, book] of candidates.entries()) {
    if (i > 0) await sleep(300);

    let metadata;
    try {
      metadata = await fetchBookMetadata(book.title);
    } catch (err) {
      const message = err instanceof BookLookupError ? err.message : "查詢失敗";
      return NextResponse.json(
        { error: message, updated, skipped, scanned: candidates.length },
        { status: 502 }
      );
    }

    if (!metadata) {
      skipped++;
      continue;
    }
    const patch = mergeEnrichment(book, metadata);
    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }
    await updateBookRow(sheetId, session.accessToken, book.id, patch);
    updated++;
  }

  return NextResponse.json({
    scanned: candidates.length,
    updated,
    skipped,
  });
}

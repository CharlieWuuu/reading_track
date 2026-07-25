import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listBooks, updateBookRow } from "@/lib/sheets";
import { fetchBookMetadata, mergeEnrichment, needsEnrichment } from "@/lib/enrichBook";

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

  for (const book of candidates) {
    const metadata = await fetchBookMetadata(book.title);
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

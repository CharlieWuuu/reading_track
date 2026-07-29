import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listBooksWithMeta, updateBookRow } from "@/lib/sheets";
import { fetchBookMetadata, mergeEnrichment, missingFields } from "@/lib/metadata";

// Vercel Hobby 方案上限就是 60 秒；升級到 Pro 可以調到 300
export const maxDuration = 60;

/** 對來源網站客氣一點，每本之間停一下 */
const DELAY_BETWEEN_BOOKS_MS = 400;

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

  // 讀取時會順便把沒有編號的列補上 uuid
  const { books, idsBackfilled } = await listBooksWithMeta(sheetId, session.accessToken);

  const candidates = books.filter((b) => b.title && missingFields(b).length > 0);

  let updated = 0;
  let skipped = 0;
  let remaining = 0;
  const failures: string[] = [];

  // 留一點餘裕收尾，時間不夠就先回報進度，使用者可以再按一次接著補
  const deadline = Date.now() + (maxDuration - 8) * 1000;

  for (const [i, book] of candidates.entries()) {
    if (Date.now() > deadline) {
      remaining = candidates.length - i;
      break;
    }
    if (i > 0) await sleep(DELAY_BETWEEN_BOOKS_MS);

    const metadata = await fetchBookMetadata(book.title, missingFields(book));
    if (!metadata) {
      skipped++;
      failures.push(book.title);
      continue;
    }

    const patch = mergeEnrichment(book, metadata);
    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    try {
      await updateBookRow(sheetId, session.accessToken, book.id, patch);
      updated++;
    } catch {
      skipped++;
      failures.push(book.title);
    }
  }

  return NextResponse.json({
    scanned: candidates.length,
    updated,
    skipped,
    remaining,
    idsBackfilled,
    failures: failures.slice(0, 10),
  });
}

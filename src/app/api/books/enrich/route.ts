import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkUpdateBooks, listBooksWithMeta } from "@/lib/sheets";
import { fetchBookMetadata, mergeEnrichment, missingFields } from "@/lib/metadata";
import { Book } from "@/types/book";

// Vercel Hobby 方案上限就是 60 秒；升級到 Pro 可以調到 300
export const maxDuration = 60;

/** 同時查幾本。查詢是網路等待為主，開幾條平行才跑得完，但也別把來源站打爆。 */
const CONCURRENCY = 4;

/** 留給最後批次寫回 Sheet 的時間 */
const WRITE_BUDGET_MS = 12000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { sheetId } = (await req.json()) as { sheetId: string };
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  const accessToken = session.accessToken;

  let books: Book[];
  let idsBackfilled: number;
  try {
    // 讀取時會順便把沒有編號的列補上 uuid
    ({ books, idsBackfilled } = await listBooksWithMeta(sheetId, accessToken));
  } catch (err) {
    console.error("enrich: 讀取 Sheet 失敗", err);
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }

  const candidates = books.filter((b) => b.title && missingFields(b).length > 0);

  const deadline = Date.now() + (maxDuration * 1000 - WRITE_BUDGET_MS);
  const patches = new Map<string, Partial<Book>>();
  const failures: string[] = [];
  let processed = 0;

  // 簡單的工作佇列：CONCURRENCY 條工人共用同一個索引
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= candidates.length || Date.now() > deadline) return;

      const book = candidates[i];
      processed++;

      const metadata = await fetchBookMetadata(book.title, missingFields(book));
      if (!metadata) {
        failures.push(book.title);
        continue;
      }

      const patch = mergeEnrichment(book, metadata);
      if (Object.keys(patch).length > 0) {
        patches.set(book.id, patch);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // 所有異動一次寫回，避免打爆 Google Sheets 的寫入配額
  try {
    await bulkUpdateBooks(sheetId, accessToken, patches);
  } catch (err) {
    console.error("enrich: 寫回 Sheet 失敗", err);
    return NextResponse.json(
      { error: "寫回 Sheet 失敗，請稍後再試", updated: 0 },
      { status: 502 }
    );
  }

  return NextResponse.json({
    scanned: processed,
    updated: patches.size,
    skipped: failures.length,
    remaining: Math.max(0, candidates.length - processed),
    idsBackfilled,
    failures: failures.slice(0, 10),
  });
}

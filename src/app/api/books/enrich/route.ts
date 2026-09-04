import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkUpdateBooks } from "@/lib/db/mutations/books";
import { listBooksWithMeta } from "@/lib/db/queries/books";
import { fetchBookMetadata, mergeEnrichment, missingFields } from "@/lib/metadata";
import { Book } from "@/types/book";

// Vercel Hobby 方案上限就是 60 秒；升級到 Pro 可以調到 300
export const maxDuration = 60;

/**
 * 同時查幾本。查詢是網路等待為主，開幾條平行才跑得完，但也別把來源站打爆——
 * 開 4 條時 Google Books 匿名配額很容易被限流回 429，整批就白跑了。
 */
const CONCURRENCY = 2;

/** 留給最後批次寫回 Sheet 的時間 */
const WRITE_BUDGET_MS = 12000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { sheetId, after } = (await req.json()) as { sheetId: string; after?: string };
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  const accessToken = session.accessToken;

  let books: Book[];
  let idsBackfilled: number;
  try {
    // 讀取時會順便把沒有編號的列補上 uuid
    ({ books, idsBackfilled } = await listBooksWithMeta());
  } catch (err) {
    console.error("enrich: 讀取 Sheet 失敗", err);
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }

  const allCandidates = books.filter((b) => b.title && missingFields(b).length > 0);

  // 查不到資料的書會一直留在候選名單裡。若每次都從頭掃，這些書會卡在前面把
  // 時間吃光，後面的書永遠輪不到。用 after 帶上次掃到哪裡，從那之後接著跑。
  const resumeAt = after ? allCandidates.findIndex((b) => b.id === after) + 1 : 0;
  const candidates = resumeAt > 0 ? allCandidates.slice(resumeAt) : allCandidates;

  const deadline = Date.now() + (maxDuration * 1000 - WRITE_BUDGET_MS);
  const patches = new Map<string, Partial<Book>>();
  /** 沒有任何來源認得這本書 */
  const notFound: string[] = [];
  /** 查到了，但剩下的空欄位沒有來源給得出來（多半是書封或頁數） */
  const noNewData: string[] = [];
  const sourceIssues = new Set<string>();
  let processed = 0;

  // 簡單的工作佇列：CONCURRENCY 條工人共用同一個索引
  let next = 0;
  let lastAttempted = -1;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= candidates.length || Date.now() > deadline) return;

      const book = candidates[i];
      lastAttempted = Math.max(lastAttempted, i);
      processed++;

      const { metadata, matched, unavailable } = await fetchBookMetadata(
        book.title,
        missingFields(book),
        { language: book.language },
      );
      for (const source of unavailable) sourceIssues.add(source);

      if (!metadata) {
        // 補過資料的書只要還有一個空欄位就會再被掃到。分開回報，
        // 才不會把「只剩書封補不到」講成「查不到這本書」。
        (matched ? noNewData : notFound).push(book.title);
        continue;
      }

      const patch = mergeEnrichment(book, metadata);
      if (Object.keys(patch).length > 0) {
        patches.set(book.id, patch);
      } else {
        noNewData.push(book.title);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  try {
    await bulkUpdateBooks(patches);
  } catch (err) {
    console.error("enrich: 寫回失敗", err);
    return NextResponse.json({ error: "寫回失敗，請稍後再試", updated: 0 }, { status: 502 });
  }

  const remaining = Math.max(0, candidates.length - (lastAttempted + 1));

  return NextResponse.json({
    scanned: processed,
    updated: patches.size,
    notFound: notFound.length,
    noNewData: noNewData.length,
    remaining,
    // 還沒掃完就把游標交給前端，下次接著跑；掃完了就清掉，重按一次從頭來
    nextAfter: remaining > 0 && lastAttempted >= 0 ? candidates[lastAttempted].id : null,
    idsBackfilled,
    notFoundTitles: notFound.slice(0, 10),
    noNewDataTitles: noNewData.slice(0, 10),
    sourceIssues: [...sourceIssues],
  });
}

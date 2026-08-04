import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/metadata";

export interface BookSearchResult {
  title: string;
  author: string;
  coverUrl: string;
  publisher: string;
  language: string;
  pageCount: string;
  wordCount: string;
  source: string;
  /** 這筆資料是從哪個頁面抓來的，帶回去填「來源網址」 */
  sourceUrl: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "缺少搜尋關鍵字" }, { status: 400 });
  }

  const found = await searchBooks(query.trim());

  const results: BookSearchResult[] = found.map((item) => ({
    title: item.title ?? "",
    author: item.author ?? "",
    coverUrl: item.coverUrl ?? "",
    publisher: item.publisher ?? "",
    language: item.language ?? "",
    pageCount: item.pageCount ?? "",
    wordCount: item.wordCount ?? "",
    source: item.source ?? "",
    sourceUrl: item.sourceUrl ?? "",
  }));

  return NextResponse.json({ results });
}

import { NextRequest, NextResponse } from "next/server";
import { scrapeArticleUrl } from "@/lib/scrapers/article";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "缺少文章網址" }, { status: 400 });
  }

  try {
    const article = await scrapeArticleUrl(url);
    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : "抓取失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

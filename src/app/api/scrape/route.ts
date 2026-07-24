import { NextRequest, NextResponse } from "next/server";
import { scrapeBookUrl } from "@/lib/scrapers";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "缺少書籍 URL" }, { status: 400 });
  }

  try {
    const book = await scrapeBookUrl(url);
    return NextResponse.json(book);
  } catch (err) {
    const message = err instanceof Error ? err.message : "爬蟲失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

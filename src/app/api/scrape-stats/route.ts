import { NextRequest, NextResponse } from "next/server";
import { fetchPublishStats } from "@/lib/scrapers/publish-stats";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "缺少網址" }, { status: 400 });
  }

  try {
    return NextResponse.json(await fetchPublishStats(url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "抓取失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

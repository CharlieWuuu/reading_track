import { NextRequest, NextResponse } from "next/server";
import { listBookmarks } from "@/lib/instapaper/client";

export async function POST(req: NextRequest) {
  const { token, tokenSecret } = await req.json();
  if (!token || !tokenSecret) {
    return NextResponse.json({ error: "尚未連接 Instapaper" }, { status: 401 });
  }

  try {
    const bookmarks = await listBookmarks({ token, tokenSecret });
    return NextResponse.json({ bookmarks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

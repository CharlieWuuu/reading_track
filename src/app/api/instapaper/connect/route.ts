import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/instapaper/client";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "請輸入帳號密碼" }, { status: 400 });
  }

  try {
    const access = await getAccessToken(username, password);
    return NextResponse.json(access);
  } catch (err) {
    const message = err instanceof Error ? err.message : "登入失敗";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

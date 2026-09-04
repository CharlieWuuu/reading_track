import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { lookupKeyword } from "@/lib/keywords/wikipedia";

/** 查一個關鍵字的維基資料但不寫回主檔：給編輯視窗填欄位用，存不存由使用者決定 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "缺少關鍵字" }, { status: 400 });

  try {
    return NextResponse.json({ keyword: await lookupKeyword(name.trim()) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查詢失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listCategories, saveCategories } from "@/lib/sheets";
import { BookCategories } from "@/types/book";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    const categories = await listCategories(sheetId, session.accessToken);
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("listCategories failed:", err);
    return NextResponse.json({ error: "讀取選項失敗" }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, categories } = (await req.json()) as {
    sheetId: string;
    categories: BookCategories;
  };
  if (!sheetId || !categories) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await saveCategories(sheetId, session.accessToken, categories);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("saveCategories failed:", err);
    return NextResponse.json({ error: "儲存選項失敗" }, { status: 502 });
  }
}

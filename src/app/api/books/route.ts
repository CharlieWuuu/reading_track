import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addBookRow, listBooks } from "@/lib/sheets";
import { Book } from "@/types/book";

async function requireSession() {
  const session = await auth();
  if (!session?.accessToken) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    const books = await listBooks(sheetId, session.accessToken!);
    return NextResponse.json({ books });
  } catch {
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, book } = (await req.json()) as { sheetId: string; book: Book };
  if (!sheetId || !book) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await addBookRow(sheetId, session.accessToken!, book);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "寫入 Sheet 失敗" }, { status: 502 });
  }
}

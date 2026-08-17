import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addEntryRow, listEntries } from "@/lib/sheets";
import { Entry } from "@/types/entry";

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
    const entries = await listEntries(sheetId, session.accessToken!);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("listEntries failed:", err);
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, entry } = (await req.json()) as { sheetId: string; entry: Entry };
  if (!sheetId || !entry) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await addEntryRow(sheetId, session.accessToken!, entry);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "寫入 Sheet 失敗" }, { status: 502 });
  }
}

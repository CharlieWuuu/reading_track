import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteArticleRow, updateArticleRow } from "@/lib/sheets";
import { Article } from "@/types/article";

async function requireSession() {
  const session = await auth();
  if (!session?.accessToken) return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { id } = await params;
  const { sheetId, patch } = (await req.json()) as {
    sheetId: string;
    patch: Partial<Article>;
  };
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    await updateArticleRow(sheetId, session.accessToken!, id, patch);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新 Sheet 失敗" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { id } = await params;
  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    await deleteArticleRow(sheetId, session.accessToken!, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 502 });
  }
}

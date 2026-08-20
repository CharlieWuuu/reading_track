import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifySheetAccess } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { sheetId } = await req.json();
  if (!sheetId || typeof sheetId !== "string") {
    return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });
  }

  try {
    const info = await verifySheetAccess(sheetId, session.accessToken);
    return NextResponse.json(info);
  } catch (err) {
    console.error("verifySheetAccess failed:", err);
    return NextResponse.json(
      { error: "無法讀取這個 Sheet，請確認 ID 正確，且此 Google 帳號有編輯權限" },
      { status: 502 },
    );
  }
}

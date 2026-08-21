import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addMetricRow, listMetrics } from "@/lib/sheets";
import { Metric } from "@/types/metric";

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
    const metrics = await listMetrics(sheetId, session.accessToken!);
    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("listMetrics failed:", err);
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, metric } = (await req.json()) as { sheetId: string; metric: Metric };
  if (!sheetId || !metric) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await addMetricRow(sheetId, session.accessToken!, metric);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "寫入 Sheet 失敗" }, { status: 502 });
  }
}

export const maxDuration = 30;

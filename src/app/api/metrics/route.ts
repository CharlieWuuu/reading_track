import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addMetricRow } from "@/lib/db/mutations/writings";
import { listMetrics } from "@/lib/db/queries/writings";
import { Metric } from "@/types/metric";

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  try {
    const metrics = await listMetrics();
    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("listMetrics failed:", err);
    return NextResponse.json({ error: "讀取失敗" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { metric } = (await req.json()) as { metric: Metric };
  if (!metric) return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });

  try {
    await addMetricRow(metric);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "寫入失敗" }, { status: 502 });
  }
}

export const maxDuration = 30;

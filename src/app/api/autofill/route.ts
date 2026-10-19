import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  guarded,
  readJsonBody,
  requireOwner,
  unauthorized,
} from "@/app/api/_lib/respond";
import { knownSources } from "@/config/autofill-sources";
import { runSources } from "@/lib/autofill";

export const maxDuration = 60;

type Body = { sources?: string[]; title?: string; url?: string; language?: string };

// 去打外部 API，不讓 demo 訪客替你消耗額度，所以要真的登入
async function POSTHandler(req: NextRequest) {
  const session = await requireOwner();
  if (!session) return unauthorized();

  const body = await readJsonBody<Body>(req, "autofill");
  const title = body?.title?.trim();
  const sources = knownSources(body?.sources ?? []);
  const url = body?.url?.trim();
  if (!title && !url) return badRequest("缺少標題或外部連結");
  if (!sources.length) return badRequest("沒有可用的補齊來源");

  try {
    const found = await runSources(sources, { title, url, language: body?.language?.trim() });
    return NextResponse.json({ found });
  } catch (err) {
    const message = err instanceof Error ? err.message : "補齊失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const POST = guarded("POST /api/autofill", POSTHandler);

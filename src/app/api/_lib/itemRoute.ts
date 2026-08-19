import { NextRequest, NextResponse } from "next/server";
import { badRequest, requireSession, sheetFailure, unauthorized } from "@/app/api/_lib/respond";

type Context = { params: Promise<{ id: string }> };

type Handler = (req: NextRequest, context: Context) => Promise<NextResponse>;

export type ItemRoute = { PATCH: Handler; DELETE: Handler };

type ItemConfig<P> = {
  /** 只拿來當 log 標籤，這一組 route 的鍵名都固定 */
  key: string;
  update: (sheetId: string, accessToken: string, id: string, patch: P) => Promise<unknown>;
  remove: (sheetId: string, accessToken: string, id: string) => Promise<unknown>;
};

export function createItemRoute<P>(config: ItemConfig<P>): ItemRoute {
  const { key, update, remove } = config;

  async function PATCH(req: NextRequest, { params }: Context): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const { sheetId, patch } = (await req.json()) as { sheetId: string; patch: P };
    if (!sheetId) return badRequest("缺少 Sheet ID");

    try {
      await update(sheetId, session.accessToken!, id, patch);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return sheetFailure("更新", `update ${key}`, err);
    }
  }

  // 這裡的 sheetId 在 query string 上，跟 PATCH 不同，是呼叫端既有的約定
  async function DELETE(req: NextRequest, { params }: Context): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const sheetId = req.nextUrl.searchParams.get("sheetId");
    if (!sheetId) return badRequest("缺少 Sheet ID");

    try {
      await remove(sheetId, session.accessToken!, id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return sheetFailure("刪除", `delete ${key}`, err);
    }
  }

  return { PATCH, DELETE };
}

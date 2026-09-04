import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  guarded,
  readJsonBody,
  requireSession,
  sheetFailure,
  unauthorized,
} from "@/app/api/_lib/respond";

type Context = { params: Promise<{ id: string }> };

type Handler = (req: NextRequest, context: Context) => Promise<NextResponse>;

export type ItemRoute = { PATCH: Handler; DELETE: Handler };

type ItemConfig<P> = {
  /** 只拿來當 log 標籤，這一組 route 的鍵名都固定 */
  key: string;
  update: (id: string, patch: P) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
};

export function createItemRoute<P>(config: ItemConfig<P>): ItemRoute {
  const { key, update, remove } = config;

  async function PATCH(req: NextRequest, { params }: Context): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await readJsonBody<{ patch: P }>(req, `update ${key}`);
    if (!body) return badRequest("請求內容不是有效的 JSON");

    try {
      await update(id, body.patch);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return sheetFailure("更新", `update ${key}`, err);
    }
  }

  async function DELETE(_req: NextRequest, { params }: Context): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
    try {
      await remove(id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return sheetFailure("刪除", `delete ${key}`, err);
    }
  }

  return { PATCH: guarded(`PATCH ${key}`, PATCH), DELETE: guarded(`DELETE ${key}`, DELETE) };
}

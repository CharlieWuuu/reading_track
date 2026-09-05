import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  readJsonBody,
  readOnly,
  requireWriter,
} from "@/app/api/_lib/respond";

type Context = { params: Promise<{ id: string }> };

type Handler = (req: NextRequest, context: Context) => Promise<NextResponse>;

export type ItemRoute = { PATCH: Handler; DELETE: Handler };

type ItemConfig<P> = {
  /** 只拿來當 log 標籤，這一組 route 的鍵名都固定 */
  key: string;
  update: (userId: string, id: string, patch: P) => Promise<unknown>;
  remove: (userId: string, id: string) => Promise<unknown>;
};

export function createItemRoute<P>(config: ItemConfig<P>): ItemRoute {
  const { key, update, remove } = config;

  async function PATCH(req: NextRequest, { params }: Context): Promise<NextResponse> {
    const session = await requireWriter();
    if (!session) return readOnly();

    const { id } = await params;
    const body = await readJsonBody<{ patch: P }>(req, `update ${key}`);
    if (!body) return badRequest("請求內容不是有效的 JSON");

    try {
      await update(session.user.id, id, body.patch);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("更新", `update ${key}`, err);
    }
  }

  async function DELETE(_req: NextRequest, { params }: Context): Promise<NextResponse> {
    const session = await requireWriter();
    if (!session) return readOnly();

    const { id } = await params;
    try {
      await remove(session.user.id, id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("刪除", `delete ${key}`, err);
    }
  }

  return { PATCH: guarded(`PATCH ${key}`, PATCH), DELETE: guarded(`DELETE ${key}`, DELETE) };
}

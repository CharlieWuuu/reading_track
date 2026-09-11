import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  readJsonBody,
  readOnly,
  requireSession,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { db } from "@/lib/db/client";
import { link, unlink } from "@/lib/db/mutations/internal-links";
import { linkedIdsOf } from "@/lib/db/queries/internal-links";
import { linkablesByIds } from "@/lib/db/queries/linkables";

/** 某筆內容目前連到誰：對方的 id、顯示文字、屬於哪個類型，tag input 開窗回填用 */
export const GET = guarded(
  "links GET",
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await ctx.params;
    try {
      const otherIds = await linkedIdsOf(session.user.id, id);
      const linkables = await linkablesByIds(session.user.id, otherIds);
      return NextResponse.json({ items: otherIds.map((i) => linkables.get(i)).filter(Boolean) });
    } catch (err) {
      return dataFailure("讀取關聯", "linksGET", err);
    }
  },
);

/** 整批換掉某筆內容的關聯，body 給對方 id 的完整清單 */
export const POST = guarded(
  "links POST",
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireWriter();
    if (!session) return unauthorized();
    if ("demo" in session) return readOnly();

    const { id } = await ctx.params;
    const body = await readJsonBody<{ otherIds?: unknown }>(req, "links POST");
    if (!body || !Array.isArray(body.otherIds)) return badRequest("缺少 otherIds");

    try {
      const otherIds = body.otherIds as string[];
      await db.transaction(async (tx) => {
        // 只動這次增刪的那幾條邊，不清光重建——id 名下可能還掛著別的功能寫入的連結
        // （例如書籍的關鍵字），全清會把那些一起弄丟
        const current = await linkedIdsOf(session.user.id, id);
        const nextSet = new Set(otherIds);
        const currentSet = new Set(current);
        for (const otherId of current)
          if (!nextSet.has(otherId)) await unlink(tx, session.user.id, id, otherId);
        for (const otherId of otherIds)
          if (!currentSet.has(otherId)) await link(tx, session.user.id, id, otherId);
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("寫入關聯", "linksPOST", err);
    }
  },
);

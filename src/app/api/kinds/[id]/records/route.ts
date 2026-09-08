import { NextResponse } from "next/server";
import { dataFailure, guarded, requireSession, unauthorized } from "@/app/api/_lib/respond";
import { listRecordsByKind } from "@/lib/db/queries/catalog";

/** 某一種類型底下的紀錄。私人過濾等資料搬過來再接，新表現在還是空的 */
export const GET = guarded(
  "kind records GET",
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await ctx.params;
    try {
      return NextResponse.json({ records: await listRecordsByKind(session.user.id, id) });
    } catch (err) {
      return dataFailure("讀取紀錄", "listRecordsByKind", err);
    }
  },
);

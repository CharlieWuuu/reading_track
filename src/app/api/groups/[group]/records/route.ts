import { NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  requireSession,
  unauthorized,
} from "@/app/api/_lib/respond";
import { KindGroup } from "@/config/record-kinds";
import { listRecordsByGroup } from "@/lib/db/queries/catalog";

/** 整堆的紀錄。概覽頁要把書籍、文章、電影混在同一份清單裡排 */
const GROUPS: KindGroup[] = ["records", "fragments", "writings"];

export const GET = guarded(
  "group records GET",
  async (_req: Request, ctx: { params: Promise<{ group: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { group } = await ctx.params;
    if (!GROUPS.includes(group as KindGroup)) return badRequest("沒有這一堆");

    try {
      const rows = await listRecordsByGroup(session.user.id, group as KindGroup);
      return NextResponse.json({ records: rows });
    } catch (err) {
      return dataFailure("讀取紀錄", "listRecordsByGroup", err);
    }
  },
);

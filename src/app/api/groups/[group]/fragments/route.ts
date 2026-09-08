import { NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  requireSession,
  unauthorized,
} from "@/app/api/_lib/respond";
import { KindGroup } from "@/config/record-kinds";
import { listFragmentsByGroup } from "@/lib/db/queries/catalog";

/** 片段與專欄共用：兩者同一張表，靠類型屬於哪一堆分 */
const GROUPS: KindGroup[] = ["fragments", "writings"];

export const GET = guarded(
  "group fragments GET",
  async (_req: Request, ctx: { params: Promise<{ group: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { group } = await ctx.params;
    if (!GROUPS.includes(group as KindGroup)) return badRequest("沒有這一堆");

    try {
      const rows = await listFragmentsByGroup(session.user.id, group as KindGroup);
      return NextResponse.json({ fragments: rows });
    } catch (err) {
      return dataFailure("讀取片段", "listFragmentsByGroup", err);
    }
  },
);

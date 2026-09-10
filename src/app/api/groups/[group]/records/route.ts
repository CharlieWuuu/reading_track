import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  requireSession,
  unauthorized,
} from "@/app/api/_lib/respond";
import { KindGroup } from "@/config/record-kinds";
import {
  listActiveRecordsByGroup,
  listDoneRecordsByGroup,
  listRecordsByGroup,
  RecordRow,
} from "@/lib/db/queries/catalog";
import { requestPrivacy } from "@/utils/privacy";

/** 整堆的紀錄。概覽頁要把書籍、文章、電影混在同一份清單裡排 */
const GROUPS: KindGroup[] = ["records", "fragments", "writings"];

const DEFAULT_LIMIT = 30;

/**
 * 自己標私人的那幾筆濾掉——書籍那種「整個分類標私人」的規則需要另外 join
 * 主題樹，這條路徑的 RecordRow 還沒接那份資料，先只擋「自己標私人」這一半。
 */
function hideSelfPrivate(rows: RecordRow[]): RecordRow[] {
  return rows.filter((row) => !row.isPrivate);
}

export const GET = guarded(
  "group records GET",
  async (req: NextRequest, ctx: { params: Promise<{ group: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { group } = await ctx.params;
    if (!GROUPS.includes(group as KindGroup)) return badRequest("沒有這一堆");

    const scope = req.nextUrl.searchParams.get("scope");
    const { unlocked } = await requestPrivacy(session.user.id, req);

    try {
      if (scope === "active") {
        const rows = await listActiveRecordsByGroup(session.user.id, group as KindGroup);
        return NextResponse.json({ records: unlocked ? rows : hideSelfPrivate(rows) });
      }

      if (scope === "done") {
        const cursor = req.nextUrl.searchParams.get("cursor");
        const limit = Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT;
        const page = await listDoneRecordsByGroup(session.user.id, group as KindGroup, {
          cursor,
          limit,
        });
        return NextResponse.json({
          ...page,
          rows: unlocked ? page.rows : hideSelfPrivate(page.rows),
        });
      }

      const rows = await listRecordsByGroup(session.user.id, group as KindGroup);
      return NextResponse.json({ records: rows });
    } catch (err) {
      return dataFailure("讀取紀錄", "listRecordsByGroup", err);
    }
  },
);

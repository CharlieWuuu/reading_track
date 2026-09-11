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
import { addRecord } from "@/lib/db/mutations/catalog";
import { addFragment } from "@/lib/db/mutations/fragment-modules";
import { listRecordsByKind } from "@/lib/db/queries/catalog";
import { kindGroupOf } from "@/lib/db/queries/kinds";
import { requestPrivacy } from "@/utils/privacy";
import { hideSelfPrivate } from "@/utils/privacy-rows";

/** 某一種類型底下的紀錄。沒解鎖就濾掉自己標私人的那幾筆，跟堆那條路同一套規則 */
export const GET = guarded(
  "kind records GET",
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await ctx.params;
    const { unlocked } = await requestPrivacy(session.user.id, req);
    try {
      const rows = await listRecordsByKind(session.user.id, id);
      return NextResponse.json({ records: unlocked ? rows : hideSelfPrivate(rows) });
    } catch (err) {
      return dataFailure("讀取紀錄", "listRecordsByKind", err);
    }
  },
);

/**
 * 新增一筆。走哪張表由類型屬於哪一堆決定——紀錄有作品那一層，片段沒有。
 *
 * 值只收這個類型勾了的欄位，其餘在 mutations 那層擋掉。
 */
export const POST = guarded(
  "kind records POST",
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireWriter();
    if (!session) return unauthorized();
    if ("demo" in session) return readOnly();

    const { id } = await ctx.params;
    const body = await readJsonBody<{ values?: unknown }>(req, "kind records POST");
    if (!body || typeof body.values !== "object" || body.values === null)
      return badRequest("看不懂的內容");

    const values = Object.fromEntries(
      Object.entries(body.values as Record<string, unknown>).filter(
        ([, value]) => typeof value === "string",
      ) as [string, string][],
    );

    try {
      const group = await kindGroupOf(session.user.id, id);
      if (!group) return badRequest("找不到這個類型");

      const newId =
        group === "records"
          ? await addRecord(session.user.id, id, values)
          : await addFragment(session.user.id, id, values);
      return NextResponse.json({ id: newId });
    } catch (err) {
      return dataFailure("新增", "addRecord", err);
    }
  },
);

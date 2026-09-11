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
import { PRIVATE_MARK } from "@/config/privacy";
import { deleteRecord, updateRecord } from "@/lib/db/mutations/catalog";
import { deleteFragment, updateFragment } from "@/lib/db/mutations/fragment-modules";
import { getFragmentValues, getRecordValues } from "@/lib/db/queries/catalog";
import { requestPrivacy } from "@/utils/privacy";

/**
 * 單筆的讀寫。紀錄與片段共用這一支——編號是唯一的，查不到就換另一張表找，
 * 呼叫端不用先知道它是哪一堆。
 */

const load = async (userId: string, id: string) =>
  (await getRecordValues(userId, id)) ?? (await getFragmentValues(userId, id));

export const GET = guarded(
  "catalog GET",
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await ctx.params;
    const { unlocked } = await requestPrivacy(session.user.id, req);
    try {
      const found = await load(session.user.id, id);
      if (!found) return badRequest("找不到這一筆");
      // 沒解鎖就當作不存在——回「這一筆是私人的」等於承認它在
      if (!unlocked && found.values.isPrivate === PRIVATE_MARK) return badRequest("找不到這一筆");
      return NextResponse.json(found);
    } catch (err) {
      return dataFailure("讀取", "getRecordValues", err);
    }
  },
);

export const PATCH = guarded(
  "catalog PATCH",
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireWriter();
    if (!session) return unauthorized();
    if ("demo" in session) return readOnly();

    const { id } = await ctx.params;
    const body = await readJsonBody<{ values?: unknown }>(req, "catalog PATCH");
    if (!body || typeof body.values !== "object" || body.values === null)
      return badRequest("看不懂的內容");

    const values = Object.fromEntries(
      Object.entries(body.values as Record<string, unknown>).filter(
        ([, value]) => typeof value === "string",
      ) as [string, string][],
    );

    try {
      const isRecord = Boolean(await getRecordValues(session.user.id, id));
      if (isRecord) await updateRecord(session.user.id, id, values);
      else await updateFragment(session.user.id, id, values);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("儲存", "updateRecord", err);
    }
  },
);

export const DELETE = guarded(
  "catalog DELETE",
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireWriter();
    if (!session) return unauthorized();
    if ("demo" in session) return readOnly();

    const { id } = await ctx.params;
    try {
      // 兩張都試：查不到的那張什麼也不會做
      await deleteRecord(session.user.id, id);
      await deleteFragment(session.user.id, id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("刪除", "deleteRecord", err);
    }
  },
);

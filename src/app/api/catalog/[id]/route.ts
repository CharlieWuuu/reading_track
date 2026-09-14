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
import { deleteWritingRow, updateWritingRow } from "@/lib/db/mutations/writings";
import { getFragmentValues, getRecordValues, getWritingValues } from "@/lib/db/queries/catalog";
import { requestPrivacy } from "@/utils/privacy";

/**
 * 單筆的讀寫。三個 group 共用這一支——編號是唯一的，查不到就換下一張表找，
 * 呼叫端不用先知道它是哪個 group。
 */

const load = async (userId: string, id: string) =>
  (await getRecordValues(userId, id)) ??
  (await getFragmentValues(userId, id)) ??
  (await getWritingValues(userId, id));

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
      // 哪張表有這筆就改哪張。三個 group 三張表，跟 GET 同一套規則
      if (await getRecordValues(session.user.id, id)) {
        await updateRecord(session.user.id, id, values);
      } else if (await getFragmentValues(session.user.id, id)) {
        await updateFragment(session.user.id, id, values);
      } else {
        // ModuleForm 送的是欄位名，換成 Writing 的說法
        await updateWritingRow(session.user.id, id, {
          title: values.title,
          note: values.body,
          date: values.endDate,
          coverUrl: values.coverUrl,
        });
      }
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
      // 三張都試：查不到的那幾張什麼也不會做
      await deleteRecord(session.user.id, id);
      await deleteFragment(session.user.id, id);
      await deleteWritingRow(session.user.id, id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("刪除", "deleteRecord", err);
    }
  },
);

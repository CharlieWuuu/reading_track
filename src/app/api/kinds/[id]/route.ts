import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  readJsonBody,
  readOnly,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { moduleDef } from "@/config/modules";
import { hideKind, updateKind } from "@/lib/db/mutations/kinds";
import { listKinds, slugTaken } from "@/lib/db/queries/kinds";

/** 網址上的那一段：小寫英數與連字號，不能是空的或以連字號開頭結尾 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * 改一個類型：名字、網址、單位、勾哪些模組。
 *
 * 改網址等於改路由，舊連結會失效——使用者自己按的，不擋。紀錄照 kind_id 關聯，
 * 搬不動也不用搬。
 */
export const PATCH = guarded(
  "kind PATCH",
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireWriter();
    if (!session) return unauthorized();
    if ("demo" in session) return readOnly();

    const { id } = await ctx.params;
    const body = await readJsonBody<{
      name?: unknown;
      slug?: unknown;
      modules?: unknown;
      amountUnit?: unknown;
      labels?: unknown;
    }>(req, "kind PATCH");
    if (!body) return badRequest("看不懂的內容");

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("類型要有名字");

    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!SLUG_PATTERN.test(slug)) return badRequest("網址只能用小寫英文、數字、連字號");

    const current = (await listKinds(session.user.id)).find((row) => row.id === id);
    if (!current) return badRequest("找不到這個類型");
    // 改成別人已經占走的網址才擋；沒動就放行
    if (slug !== current.slug && (await slugTaken(session.user.id, current.group, slug)))
      return badRequest("這個網址已經有人用了");

    const modules = Array.isArray(body.modules)
      ? body.modules.filter(
          (key): key is string => typeof key === "string" && Boolean(moduleDef(key)),
        )
      : [];
    const amountUnit = typeof body.amountUnit === "string" ? body.amountUnit.trim() : "";
    const labels =
      body.labels && typeof body.labels === "object"
        ? (Object.fromEntries(
            Object.entries(body.labels as Record<string, unknown>).filter(
              ([, value]) => typeof value === "string",
            ),
          ) as Record<string, string>)
        : {};

    try {
      const newId = await updateKind(session.user.id, id, {
        name,
        slug,
        modules,
        amountUnit,
        labels,
      });
      return NextResponse.json({ id: newId });
    } catch (err) {
      return dataFailure("儲存類型", "updateKind", err);
    }
  },
);

/**
 * 關掉一個類型。
 *
 * 底下還有資料就不給關——手動記的東西沒有還原路徑，先把資料刪光那一步本身就是確認。
 * count 讀 listKinds 那份，跟側欄看到的數字是同一個來源，不會出現「畫面說 0 但擋下來」。
 */
export const DELETE = guarded(
  "kind DELETE",
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const session = await requireWriter();
    if (!session) return unauthorized();
    if ("demo" in session) return readOnly();

    const { id } = await ctx.params;

    try {
      const kind = (await listKinds(session.user.id)).find((row) => row.id === id);
      if (!kind) return badRequest("找不到這個類型");
      if (kind.count > 0) return badRequest(`還有 ${kind.count} 筆${kind.name}，要先清空才能移除`);

      await hideKind(session.user.id, id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("移除類型", "hideKind", err);
    }
  },
);

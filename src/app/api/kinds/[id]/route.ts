import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  readOnly,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { hideKind } from "@/lib/db/mutations/kinds";
import { listKinds } from "@/lib/db/queries/kinds";

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

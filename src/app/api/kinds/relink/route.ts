import { NextResponse } from "next/server";
import {
  dataFailure,
  guarded,
  readOnly,
  requireSession,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { findStuckKinds, relinkStuckKinds } from "@/lib/db/mutations/kinds";

/** 有沒有資料卡在共用類型上，卡了幾筆。設定頁要先問過才敢按 */
export const GET = guarded("kinds relink GET", async () => {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const stuck = await findStuckKinds(session.user.id);
    return NextResponse.json({
      stuck: stuck.map((row) => ({
        name: row.name,
        n: row.n,
        // 對不出唯一一份就不給按，畫面照這個決定顯示什麼
        movable: row.targets.length === 1,
      })),
    });
  } catch (err) {
    return dataFailure("讀取", "findStuckKinds", err);
  }
});

/** 真的接回去。回傳搬了幾筆，呼叫端拿去重讀類型清單 */
export const POST = guarded("kinds relink POST", async () => {
  const session = await requireWriter();
  if (!session) return unauthorized();
  if ("demo" in session) return readOnly();

  try {
    const moved = await relinkStuckKinds(session.user.id);
    return NextResponse.json({ moved });
  } catch (err) {
    return dataFailure("接回資料", "relinkStuckKinds", err);
  }
});

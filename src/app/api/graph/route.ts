import { NextResponse } from "next/server";
import { dataFailure, guarded, requireSession, unauthorized } from "@/app/api/_lib/respond";
import { graphData } from "@/lib/db/queries/graph";

/** 設定頁那張關係圖的節點與邊 */
export const GET = guarded("graph GET", async () => {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    return NextResponse.json(await graphData(session.user.id));
  } catch (err) {
    return dataFailure("關係圖", "graphData", err);
  }
});

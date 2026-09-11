import { NextRequest, NextResponse } from "next/server";
import { dataFailure, guarded, requireSession, unauthorized } from "@/app/api/_lib/respond";
import { searchLinkables } from "@/lib/db/queries/linkables";

/** 跨作品／片段／書寫模糊搜尋，給站內連結的 tag input 用 */
export const GET = guarded("links search GET", async (req: NextRequest) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const exclude = searchParams.get("exclude") ?? undefined;
  if (!query) return NextResponse.json({ items: [] });

  try {
    return NextResponse.json({ items: await searchLinkables(session.user.id, query, exclude) });
  } catch (err) {
    return dataFailure("搜尋", "searchLinkables", err);
  }
});

import { NextRequest, NextResponse } from "next/server";
import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { dataFailure, guarded, requireSession, unauthorized } from "@/app/api/_lib/respond";
import { ITEM_KEYS } from "@/config/item-keys";
import { addWritingRow } from "@/lib/db/mutations/writings";
import { listWritings, listWritingsPaged } from "@/lib/db/queries/writings";

const route = createCollectionRoute({
  key: "writings",
  itemKey: ITEM_KEYS.writings,
  list: listWritings,
  add: addWritingRow,
});

const DEFAULT_LIMIT = 30;

/** 概覽頁專用：cursor 分頁；沒帶 scope 走原本整包的路（表格檢視、搜尋要整包） */
const GET = guarded("writings GET", async (req: NextRequest) => {
  if (req.nextUrl.searchParams.get("scope") !== "done") return route.GET(req);

  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT;
    const page = await listWritingsPaged(session.user.id, { cursor, limit });
    return NextResponse.json(page);
  } catch (err) {
    return dataFailure("讀取書寫", "listWritingsPaged", err);
  }
});

export { GET };
export const POST = route.POST;

export const maxDuration = 30;

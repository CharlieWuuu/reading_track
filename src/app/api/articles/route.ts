import { NextRequest, NextResponse } from "next/server";
import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import {
  badRequest,
  dataFailure,
  guarded,
  requireSession,
  unauthorized,
} from "@/app/api/_lib/respond";
import { ITEM_KEYS } from "@/config/item-keys";
import { addArticleRow } from "@/lib/db/mutations/articles";
import { listArticles, listDoneArticles, listPendingArticles } from "@/lib/db/queries/articles";
import { requestPrivacy, withPrivacy } from "@/utils/privacy";

const route = createCollectionRoute({
  key: "articles",
  itemKey: ITEM_KEYS.articles,
  list: listArticles,
  add: addArticleRow,
});

const DEFAULT_LIMIT = 30;

/** 概覽頁專用：scope=pending 整包、scope=done 分頁；沒帶 scope 走原本整包的路 */
const GET = guarded("articles GET", async (req: NextRequest) => {
  const scope = req.nextUrl.searchParams.get("scope");
  if (!scope) return route.GET(req);

  const session = await requireSession();
  if (!session) return unauthorized();
  const privacy = await requestPrivacy(session.user.id, req);

  try {
    if (scope === "pending") {
      const rows = await listPendingArticles(session.user.id);
      return NextResponse.json({ articles: withPrivacy(rows, privacy) });
    }

    if (scope === "done") {
      const cursor = req.nextUrl.searchParams.get("cursor");
      const limit = Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT;
      const page = await listDoneArticles(session.user.id, { cursor, limit });
      return NextResponse.json({ ...page, rows: withPrivacy(page.rows, privacy) });
    }

    return badRequest("scope 不認得");
  } catch (err) {
    return dataFailure("讀取文章", "listDoneArticles", err);
  }
});

export { GET };
export const POST = route.POST;

export const maxDuration = 30;

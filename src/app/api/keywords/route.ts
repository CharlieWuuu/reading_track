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
import { deleteKeyword, renameKeyword, replaceKeywordInfo } from "@/lib/db/mutations/fragments";
import { listKeywords } from "@/lib/db/queries/fragments";
import { KeywordInfo } from "@/types/keyword";

async function GETHandler() {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const keywords = await listKeywords(session.user.id);
    return NextResponse.json({ keywords });
  } catch (err) {
    return dataFailure("讀取", "listKeywords", err);
  }
}

// 名字就是身分，所以改名要先搬（連帶改寫引用它的書），再照寫整列
async function PUTHandler(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return unauthorized();
  if ("demo" in session) return readOnly();

  const body = await readJsonBody<{ keyword?: KeywordInfo; previousName?: string }>(
    req,
    "keywords PUT",
  );
  const keyword = body?.keyword;
  if (!keyword?.name?.trim()) return badRequest("缺少關鍵字名稱");

  try {
    const previousName = body?.previousName?.trim();
    if (previousName && previousName !== keyword.name)
      await renameKeyword(session.user.id, previousName, keyword.name);
    await replaceKeywordInfo(session.user.id, keyword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dataFailure("儲存", "replaceKeywordInfo", err);
  }
}

async function DELETEHandler(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return unauthorized();
  if ("demo" in session) return readOnly();

  const body = await readJsonBody<{ name?: string }>(req, "keywords DELETE");
  const name = body?.name?.trim();
  if (!name) return badRequest("缺少關鍵字名稱");

  try {
    const removed = await deleteKeyword(session.user.id, name); // 動到幾本書，前端要拿去重讀書單
    return NextResponse.json({ removed });
  } catch (err) {
    return dataFailure("刪除", "deleteKeyword", err);
  }
}

export const GET = guarded("keywords GET", GETHandler);
export const PUT = guarded("keywords PUT", PUTHandler);
export const DELETE = guarded("keywords DELETE", DELETEHandler);

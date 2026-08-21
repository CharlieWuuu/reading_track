import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  guarded,
  readJsonBody,
  requireSession,
  sheetFailure,
  unauthorized,
} from "@/app/api/_lib/respond";
import { enrichKeywords } from "@/lib/keywords/enrich";
import { deleteKeyword, listKeywordInfos, renameKeyword, replaceKeywordInfo } from "@/lib/sheets";
import { KeywordInfo } from "@/types/keyword";

async function GETHandler(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return badRequest("缺少 Sheet ID");

  try {
    const keywords = await listKeywordInfos(sheetId, session.accessToken!);
    return NextResponse.json({ keywords });
  } catch (err) {
    return sheetFailure("讀取", "listKeywordInfos", err);
  }
}

/** 把還沒查過的關鍵字查回來寫進主檔，回報這次補了幾個、還剩幾個 */
async function POSTHandler(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const body = await readJsonBody<{
    sheetId: string;
    names: string[];
    /** true 時連「查過但沒查到」的也重查一次；平常不重查，免得每次都白跑一趟 */
    retry?: boolean;
  }>(req, "enrich keywords");
  if (!body) return badRequest("請求內容不是有效的 JSON");

  const { sheetId, names, retry } = body;
  if (!sheetId || !Array.isArray(names)) {
    return badRequest("缺少必要欄位");
  }

  try {
    const result = await enrichKeywords(sheetId, session.accessToken!, names, retry);
    return NextResponse.json(result);
  } catch (err) {
    return sheetFailure("補齊", "enrichKeywords", err);
  }
}

/** 手動改一筆關鍵字主檔 */
async function PUTHandler(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const body = await readJsonBody<{
    sheetId: string;
    keyword: KeywordInfo;
    /** 有改名時帶原本的名字進來 */
    previousName?: string;
  }>(req, "replace keyword");
  if (!body) return badRequest("請求內容不是有效的 JSON");

  const { sheetId, keyword, previousName } = body;
  if (!sheetId || !keyword?.name) {
    return badRequest("缺少必要欄位");
  }

  try {
    await replaceKeywordInfo(sheetId, session.accessToken!, keyword, previousName);

    // 書籍表用名字指向主檔，改名一定要連帶改寫，不然那些書就對不上了
    const renamed =
      previousName && previousName !== keyword.name
        ? await renameKeyword(sheetId, session.accessToken!, previousName, keyword.name)
        : 0;

    return NextResponse.json({ ok: true, renamed });
  } catch (err) {
    return sheetFailure("儲存", "replaceKeywordInfo", err);
  }
}

async function DELETEHandler(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const body = await readJsonBody<{ sheetId: string; name: string }>(req, "delete keyword");
  if (!body) return badRequest("請求內容不是有效的 JSON");

  const { sheetId, name } = body;
  if (!sheetId || !name?.trim()) {
    return badRequest("缺少必要欄位");
  }

  try {
    const removed = await deleteKeyword(sheetId, session.accessToken!, name.trim());
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    return sheetFailure("刪除", "deleteKeyword", err);
  }
}

export const maxDuration = 30;

export const GET = guarded("GET keywords", GETHandler);
export const POST = guarded("POST keywords", POSTHandler);
export const PUT = guarded("PUT keywords", PUTHandler);
export const DELETE = guarded("DELETE keywords", DELETEHandler);

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
import { deleteKeyword, renameKeyword, replaceKeywordInfo } from "@/lib/db/mutations/records";
import { listKeywords } from "@/lib/db/queries/records";
import { enrichKeywords } from "@/lib/keywords/enrich";
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

/** 把還沒查過的關鍵字查回來寫進主檔，回報這次補了幾個、還剩幾個 */
async function POSTHandler(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return readOnly();

  const body = await readJsonBody<{
    names: string[];
    /** true 時連「查過但沒查到」的也重查一次；平常不重查，免得每次都白跑一趟 */
    retry?: boolean;
  }>(req, "enrich keywords");
  if (!body) return badRequest("請求內容不是有效的 JSON");

  const { names, retry } = body;
  if (!Array.isArray(names)) return badRequest("缺少必要欄位");

  try {
    const result = await enrichKeywords(session.user.id, names, retry);
    return NextResponse.json(result);
  } catch (err) {
    return dataFailure("補齊", "enrichKeywords", err);
  }
}

/** 手動改一筆關鍵字主檔 */
async function PUTHandler(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return readOnly();

  const body = await readJsonBody<{
    keyword: KeywordInfo;
    /** 有改名時帶原本的名字進來 */
    previousName?: string;
  }>(req, "replace keyword");
  if (!body) return badRequest("請求內容不是有效的 JSON");

  const { keyword, previousName } = body;
  if (!keyword?.name) return badRequest("缺少必要欄位");

  try {
    // 改名先做：名字是主鍵，關聯表靠 on update cascade 跟著改
    const renamed =
      previousName && previousName !== keyword.name
        ? await renameKeyword(session.user.id, previousName, keyword.name)
        : 0;
    await replaceKeywordInfo(session.user.id, keyword);

    return NextResponse.json({ ok: true, renamed });
  } catch (err) {
    return dataFailure("儲存", "replaceKeywordInfo", err);
  }
}

async function DELETEHandler(req: NextRequest) {
  const session = await requireWriter();
  if (!session) return readOnly();

  const body = await readJsonBody<{ name: string }>(req, "delete keyword");
  if (!body) return badRequest("請求內容不是有效的 JSON");

  const name = body.name?.trim();
  if (!name) return badRequest("缺少必要欄位");

  try {
    const removed = await deleteKeyword(session.user.id, name);
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    return dataFailure("刪除", "deleteKeyword", err);
  }
}

export const maxDuration = 30;

export const GET = guarded("GET keywords", GETHandler);
export const POST = guarded("POST keywords", POSTHandler);
export const PUT = guarded("PUT keywords", PUTHandler);
export const DELETE = guarded("DELETE keywords", DELETEHandler);

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { lookupKeyword } from "@/lib/keywords/wikipedia";
import {
  deleteKeyword,
  listKeywordInfos,
  renameKeyword,
  replaceKeywordInfo,
  saveKeywordInfos,
} from "@/lib/sheets";
import { KeywordInfo } from "@/types/keyword";

/** 一次補太多會打爆維基也拖垮 request，多的留給下一次 */
const MAX_PER_RUN = 20;

/** 連續打 Wikidata 會被回「too many requests」，隔一下再問下一個 */
const GAP_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    const keywords = await listKeywordInfos(sheetId, session.accessToken);
    return NextResponse.json({ keywords });
  } catch (err) {
    console.error("listKeywordInfos failed:", err);
    return NextResponse.json({ error: "讀取關鍵字失敗" }, { status: 502 });
  }
}

/** 有維基連結，或使用者自己手填了摘要，都算有資料了 */
function isFilled(info: { wikiUrl: string; summary: string }): boolean {
  return Boolean(info.wikiUrl || info.summary);
}

/** 把還沒查過的關鍵字查回來寫進主檔，回報這次補了幾個、還剩幾個 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, names, retry } = (await req.json()) as {
    sheetId: string;
    names: string[];
    /** true 時連「查過但沒查到」的也重查一次；平常不重查，免得每次都白跑一趟 */
    retry?: boolean;
  };
  if (!sheetId || !Array.isArray(names)) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    const existing = await listKeywordInfos(sheetId, session.accessToken);
    // 平常只查主檔裡沒有的那些：查過就會留下一列，即使是空的，
    // 那代表「維基沒有這個條目」，不該每次補齊都再去問一次。
    const known = new Set((retry ? existing.filter(isFilled) : existing).map((info) => info.name));
    const pending = names.map((n) => n.trim()).filter((n) => n && !known.has(n));

    const infos = [];
    for (const name of pending.slice(0, MAX_PER_RUN)) {
      if (infos.length > 0) await sleep(GAP_MS);
      const found = await lookupKeyword(name);
      // 學科是手動填的，維基查回來的那一份不帶它，重查也不能把人填的洗掉
      const previous = existing.find((info) => info.name === name);
      infos.push({ ...found, topics: previous?.topics ?? "" });
    }
    await saveKeywordInfos(sheetId, session.accessToken, infos);

    return NextResponse.json({
      added: infos.length,
      // 查得到摘要的才算補到東西，其餘是維基沒有這個條目
      found: infos.filter((info) => info.summary).length,
      remaining: Math.max(0, pending.length - infos.length),
    });
  } catch (err) {
    console.error("enrichKeywords failed:", err);
    return NextResponse.json({ error: "補齊關鍵字失敗" }, { status: 502 });
  }
}

/** 手動改一筆關鍵字主檔 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, keyword, previousName } = (await req.json()) as {
    sheetId: string;
    keyword: KeywordInfo;
    /** 有改名時帶原本的名字進來 */
    previousName?: string;
  };
  if (!sheetId || !keyword?.name) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await replaceKeywordInfo(sheetId, session.accessToken, keyword, previousName);

    // 書籍表用名字指向主檔，改名一定要連帶改寫，不然那些書就對不上了
    const renamed =
      previousName && previousName !== keyword.name
        ? await renameKeyword(sheetId, session.accessToken, previousName, keyword.name)
        : 0;

    return NextResponse.json({ ok: true, renamed });
  } catch (err) {
    console.error("replaceKeywordInfo failed:", err);
    return NextResponse.json({ error: "儲存關鍵字失敗" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId, name } = (await req.json()) as { sheetId: string; name: string };
  if (!sheetId || !name?.trim()) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    const removed = await deleteKeyword(sheetId, session.accessToken, name.trim());
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    console.error("deleteKeyword failed:", err);
    return NextResponse.json({ error: "刪除關鍵字失敗" }, { status: 502 });
  }
}

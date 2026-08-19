import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  guarded,
  readJsonBody,
  requireSession,
  sheetFailure,
  unauthorized,
} from "@/app/api/_lib/respond";
import { requestUnlocked, withPrivacy } from "@/utils/privacy";

/** 有 private 欄位才過得了 withPrivacy，三種紀錄都符合 */
type Row = { private?: string };

type Handler = (req: NextRequest) => Promise<NextResponse>;

export type CollectionRoute = { GET: Handler; POST: Handler };

type CollectionConfig<T extends Row> = {
  /** 路徑上的那一段，也是回應裡包住資料的鍵：/api/books 回 { books: [...] } */
  key: string;
  /** POST body 裡包住單筆的鍵，是 key 的單數：{ sheetId, book } */
  itemKey: string;
  list: (sheetId: string, accessToken: string) => Promise<T[]>;
  add: (sheetId: string, accessToken: string, item: T) => Promise<unknown>;
};

export function createCollectionRoute<T extends Row>(config: CollectionConfig<T>): CollectionRoute {
  const { key, itemKey, list, add } = config;

  async function GET(req: NextRequest): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    const sheetId = req.nextUrl.searchParams.get("sheetId");
    if (!sheetId) return badRequest("缺少 Sheet ID");

    try {
      const rows = await list(sheetId, session.accessToken!);
      // 鎖著的時候私人的那幾筆根本不會離開伺服器
      const unlocked = await requestUnlocked(req, sheetId, session.accessToken!);
      return NextResponse.json({ [key]: withPrivacy(rows, unlocked) });
    } catch (err) {
      return sheetFailure("讀取", `list ${key}`, err);
    }
  }

  async function POST(req: NextRequest): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    const body = await readJsonBody<{ sheetId?: string } & Record<string, unknown>>(
      req,
      `add ${key}`,
    );
    if (!body) return badRequest("請求內容不是有效的 JSON");

    const sheetId = body.sheetId;
    const item = body[itemKey] as T | undefined;
    if (!sheetId || !item) return badRequest("缺少必要欄位");

    try {
      await add(sheetId, session.accessToken!, item);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return sheetFailure("寫入", `add ${key}`, err);
    }
  }

  return { GET: guarded(`GET ${key}`, GET), POST: guarded(`POST ${key}`, POST) };
}

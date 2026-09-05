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
import { PrivateRow, requestPrivacy, withPrivacy } from "@/utils/privacy";

/** 有 private 欄位才過得了 withPrivacy，三種紀錄都符合 */
type Row = PrivateRow;

type Handler = (req: NextRequest) => Promise<NextResponse>;

export type CollectionRoute = { GET: Handler; POST: Handler };

type CollectionConfig<T extends Row> = {
  /** 路徑上的那一段，也是回應裡包住資料的鍵：/api/books 回 { books: [...] } */
  key: string;
  /** POST body 裡包住單筆的鍵，是 key 的單數：{ book } */
  itemKey: string;
  list: (userId: string) => Promise<T[]>;
  add: (userId: string, item: T) => Promise<unknown>;
};

export function createCollectionRoute<T extends Row>(config: CollectionConfig<T>): CollectionRoute {
  const { key, itemKey, list, add } = config;

  async function GET(req: NextRequest): Promise<NextResponse> {
    const session = await requireSession();
    if (!session) return unauthorized();

    try {
      const rows = await list(session.user.id);
      // 鎖著的時候私人的那幾筆根本不會離開伺服器
      const privacy = await requestPrivacy(session.user.id, req);
      return NextResponse.json({ [key]: withPrivacy(rows, privacy) });
    } catch (err) {
      return dataFailure("讀取", `list ${key}`, err);
    }
  }

  async function POST(req: NextRequest): Promise<NextResponse> {
    const session = await requireWriter();
    if (!session) return readOnly();

    const body = await readJsonBody<{ sheetId?: string } & Record<string, unknown>>(
      req,
      `add ${key}`,
    );
    if (!body) return badRequest("請求內容不是有效的 JSON");

    const item = body[itemKey] as T | undefined;
    if (!item) return badRequest("缺少必要欄位");

    try {
      await add(session.user.id, item);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return dataFailure("寫入", `add ${key}`, err);
    }
  }

  return { GET: guarded(`GET ${key}`, GET), POST: guarded(`POST ${key}`, POST) };
}

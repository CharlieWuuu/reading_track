import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.accessToken) return null;
  return session;
}

export const unauthorized = () => NextResponse.json({ error: "請先登入" }, { status: 401 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

/** google-spreadsheet 底層是 ky，丟的 HTTPError 會保留原始狀態碼 */
function statusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("response" in err)) return undefined;
  return (err as { response?: { status?: number } }).response?.status;
}

/** 六支 route 共用的失敗回應：502 一定留 log */
export function sheetFailure(what: string, label: string, err: unknown): NextResponse {
  // 配額每分鐘重置，等一下就會好，不該跟「Sheet 真的壞了」混在一起
  if (statusOf(err) === 429) {
    console.warn(`${label} rate limited:`, err);
    return NextResponse.json(
      { error: "Sheet 存取太頻繁，請稍候再試" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  console.error(`${label} failed:`, err);
  return NextResponse.json({ error: `${what} Sheet 失敗` }, { status: 502 });
}

/** body 解不出來就回 null，這是客戶端的錯不是 Sheet 的錯 */
export async function readJsonBody<T>(req: NextRequest, label: string): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch (err) {
    console.error(`${label} bad json:`, err);
    return null;
  }
}

/** 最外圈的網子：漏到這裡的都是沒預料到的，一律 500 並留 log */
export function guarded<A extends unknown[]>(
  label: string,
  handler: (...args: A) => Promise<NextResponse>,
): (...args: A) => Promise<NextResponse> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`${label} crashed:`, err);
      return NextResponse.json({ error: "伺服器發生非預期錯誤" }, { status: 500 });
    }
  };
}

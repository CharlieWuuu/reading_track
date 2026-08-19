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

/** 六支 route 共用的失敗回應：502 一定留 log */
export function sheetFailure(what: string, label: string, err: unknown): NextResponse {
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

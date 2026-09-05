import { NextRequest, NextResponse } from "next/server";
import { DEMO_EMAIL } from "@/config/demo";
import { auth } from "@/lib/auth";
import { findUserByEmail } from "@/lib/db/queries/users";

/** demo 帳號的 uuid 查一次就好，同一個實例裡不會變 */
let demoUserId: string | null = null;

async function demoViewer() {
  if (!DEMO_EMAIL) return null;
  demoUserId ??= (await findUserByEmail(DEMO_EMAIL))?.id ?? null;
  return demoUserId ? { user: { id: demoUserId }, demo: true as const } : null;
}

/**
 * 讀取用。demo 站沒登入的訪客也算數，看到的是 demo 帳號的資料。
 *
 * userId 是每支查詢的依據，沒有它就當作沒登入——寧可要求重新登入，
 * 也不要拿 undefined 去比對。
 */
export async function requireSession() {
  const session = await auth();
  if (session?.user?.id) return session;
  return demoViewer();
}

/** 寫入用。demo 訪客過不了這一關，真的登入才行 */
export async function requireWriter() {
  const session = await auth();
  return session?.user?.id ? session : null;
}

export const unauthorized = () => NextResponse.json({ error: "請先登入" }, { status: 401 });

/** demo 站的訪客按到寫入時的回應 */
export const readOnly = () => NextResponse.json({ error: "展示版不能修改資料" }, { status: 403 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

/** 六支 route 共用的失敗回應：502 一定留 log */
export function dataFailure(what: string, label: string, err: unknown): NextResponse {
  console.error(`${label} failed:`, err);
  return NextResponse.json({ error: `${what}失敗` }, { status: 502 });
}

/** body 解不出來就回 null，這是客戶端的錯 */
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

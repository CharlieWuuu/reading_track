import { NextResponse } from "next/server";
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

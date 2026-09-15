import { NextResponse } from "next/server";
import postgres from "postgres";

/**
 * 資料庫連得上嗎、要多久。
 *
 * 不需要登入也不吐任何資料——它只回時間與錯誤代碼。存在的理由是：
 * 線上卡住的時候，一般的 route 只會逾時，看不出卡在連線還是查詢。
 */
/**
 * 連的是哪個 Supabase 專案。pooler 的主機名三個專案都一樣，分不出來——
 * 專案編號藏在使用者名稱裡（postgres.<ref>）。
 *
 * 需要它是因為踩過兩次：shell 裡 `set -a . ./.env.prod` 留下的 DATABASE_URL
 * 會被 dev server 繼承，而 .env.local 不覆蓋已存在的環境變數，結果本機連到正式庫。
 */
const projectRef = (url: string): string => new URL(url).username.split(".")[1] ?? "";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ ok: false, reason: "DATABASE_URL 沒設" }, { status: 500 });

  const started = Date.now();
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 8, idle_timeout: 5 });

  try {
    await sql`select 1`;
    const ms = Date.now() - started;
    await sql.end({ timeout: 3 });
    return NextResponse.json({ ok: true, ms, host: new URL(url).host, project: projectRef(url) });
  } catch (err) {
    const cause = (err as { cause?: { message?: string; code?: string } }).cause;
    await sql.end({ timeout: 1 }).catch(() => {});
    return NextResponse.json(
      {
        ok: false,
        ms: Date.now() - started,
        host: new URL(url).host,
        message: (err as Error).message,
        cause: cause?.message,
        code: cause?.code,
      },
      { status: 503 },
    );
  }
}

export const maxDuration = 15;

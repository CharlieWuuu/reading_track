import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkUpdateBooks, listBooks } from "@/lib/sheets";
import { Book } from "@/types/book";

export const maxDuration = 30;

/**
 * 把「同一本書編號」寫回去。
 *
 * 收的是前端整理好、而且人已經按過確認的一份對照表——這支不自己判斷哪幾列
 * 是同一本書。理由寫在 utils/reread-candidates：書名有錯字或真的是不同版本的
 * 那種，本來就需要人看一眼。
 *
 * 仍然要驗一次編號存不存在：前端送來的東西不能直接寫進使用者的 Sheet。
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { sheetId, links } = (await req.json()) as {
    sheetId?: string;
    links?: Record<string, string>;
  };
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });
  if (!links || Object.keys(links).length === 0) {
    return NextResponse.json({ error: "沒有要連結的列" }, { status: 400 });
  }

  let books: Book[];
  try {
    books = await listBooks(sheetId, session.accessToken);
  } catch (err) {
    console.error("link-rereads: 讀取 Sheet 失敗", err);
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }

  const ids = new Set(books.map((b) => b.id));
  const patches = new Map<string, Partial<Book>>();
  for (const [id, originId] of Object.entries(links)) {
    // 指到自己會變成一個環，那一列就再也找不回源頭
    if (id === originId) continue;
    if (!ids.has(id) || !ids.has(originId)) continue;
    patches.set(id, { originId });
  }

  if (patches.size === 0) {
    return NextResponse.json({ error: "沒有對得上的列" }, { status: 400 });
  }

  try {
    await bulkUpdateBooks(sheetId, session.accessToken, patches);
  } catch (err) {
    console.error("link-rereads: 寫回 Sheet 失敗", err);
    return NextResponse.json({ error: "寫回 Sheet 失敗，請稍後再試" }, { status: 502 });
  }

  return NextResponse.json({ linked: patches.size });
}

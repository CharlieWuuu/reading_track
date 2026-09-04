import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { linkReread } from "@/lib/db/mutations/books";
import { listBooks } from "@/lib/db/queries/books";
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

  const { links } = (await req.json()) as { links?: Record<string, string> };
  if (!links || Object.keys(links).length === 0) {
    return NextResponse.json({ error: "沒有要連結的列" }, { status: 400 });
  }

  let books: Book[];
  try {
    books = await listBooks();
  } catch (err) {
    console.error("link-rereads: 讀取失敗", err);
    return NextResponse.json({ error: "讀取失敗" }, { status: 502 });
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

  let linked = 0;
  try {
    for (const [id, patch] of patches) {
      if (await linkReread(id, patch.originId!)) linked++;
    }
  } catch (err) {
    console.error("link-rereads: 寫回失敗", err);
    return NextResponse.json({ error: "寫回失敗，請稍後再試" }, { status: 502 });
  }

  return NextResponse.json({ linked });
}

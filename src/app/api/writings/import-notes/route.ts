import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addWritingRows } from "@/lib/db/mutations/writings";
import { listArticles } from "@/lib/db/queries/articles";
import { listBooks } from "@/lib/db/queries/books";
import { listWritings } from "@/lib/db/queries/writings";
import { Writing } from "@/types/writing";

/**
 * 把書籍與文章的「心得／筆記」欄搬成一則則紀事。
 *
 * 刻意不動原本那一欄——搬錯了才有得回頭。已經搬過的靠「延伸自編號」認出來，
 * 按第二次不會重複搬。
 */
async function collect() {
  const [books, articles, writings] = await Promise.all([
    listBooks(),
    listArticles(),
    listWritings(),
  ]);

  const migrated = new Set(writings.map((e) => e.sourceId).filter(Boolean));

  const sources = [
    ...books.map((b) => ({
      id: b.id,
      title: b.title,
      note: b.note,
      date: b.endDate,
      kind: "書籍",
    })),
    ...articles.map((a) => ({
      id: a.id,
      title: a.title,
      note: a.note,
      date: a.endDate,
      kind: "文章",
    })),
  ];

  return sources
    .filter((s) => s.note.trim() && !migrated.has(s.id))
    .map<Writing>((s) => ({
      id: crypto.randomUUID(),
      date: s.date ?? "",
      title: s.title,
      kind: s.kind, // 照來源標，跟書籍／文章頁寫出來的紀事同一組選項
      keywords: "",
      note: s.note,
      link: "",
      sourceTitle: s.title,
      sourceId: s.id,
      private: "",
    }));
}

async function requireSession() {
  const session = await auth();
  return session?.accessToken ? session : null;
}

/** 預覽會搬幾筆，不寫入 */
export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  try {
    const pending = await collect();
    return NextResponse.json({ pending: pending.length, titles: pending.map((e) => e.title) });
  } catch (err) {
    console.error("import-notes preview failed:", err);
    return NextResponse.json({ error: "讀取失敗" }, { status: 502 });
  }
}

export async function POST() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  try {
    const pending = await collect();
    await addWritingRows(pending);
    return NextResponse.json({ migrated: pending.length });
  } catch (err) {
    console.error("import-notes failed:", err);
    return NextResponse.json({ error: "搬移失敗" }, { status: 502 });
  }
}

export const maxDuration = 30;

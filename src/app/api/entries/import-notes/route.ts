import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addEntryRows, listArticles, listBooks, listEntries } from "@/lib/sheets";
import { Entry } from "@/types/entry";

/**
 * 把書籍與文章的「心得／筆記」欄搬成一則則紀事。
 *
 * 刻意不動原本那一欄——搬錯了才有得回頭。已經搬過的靠「延伸自編號」認出來，
 * 按第二次不會重複搬。
 */
async function collect(sheetId: string, accessToken: string) {
  const [books, articles, entries] = await Promise.all([
    listBooks(sheetId, accessToken),
    listArticles(sheetId, accessToken),
    listEntries(sheetId, accessToken),
  ]);

  const migrated = new Set(entries.map((e) => e.sourceId).filter(Boolean));

  const sources = [
    ...books.map((b) => ({ id: b.id, title: b.title, note: b.note, date: b.endDate })),
    ...articles.map((a) => ({ id: a.id, title: a.title, note: a.note, date: a.endDate })),
  ];

  return sources
    .filter((s) => s.note.trim() && !migrated.has(s.id))
    .map<Entry>((s) => ({
      id: crypto.randomUUID(),
      date: s.date ?? "",
      title: s.title,
      kind: "心得",
      keywords: "",
      note: s.note,
      link: "",
      sourceTitle: s.title,
      sourceId: s.id,
    }));
}

async function requireSession() {
  const session = await auth();
  return session?.accessToken ? session : null;
}

/** 預覽會搬幾筆，不寫入 */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    const pending = await collect(sheetId, session.accessToken!);
    return NextResponse.json({ pending: pending.length, titles: pending.map((e) => e.title) });
  } catch (err) {
    console.error("import-notes preview failed:", err);
    return NextResponse.json({ error: "讀取 Sheet 失敗" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { sheetId } = (await req.json()) as { sheetId: string };
  if (!sheetId) return NextResponse.json({ error: "缺少 Sheet ID" }, { status: 400 });

  try {
    const pending = await collect(sheetId, session.accessToken!);
    await addEntryRows(sheetId, session.accessToken!, pending);
    return NextResponse.json({ migrated: pending.length });
  } catch (err) {
    console.error("import-notes failed:", err);
    return NextResponse.json({ error: "搬移失敗" }, { status: 502 });
  }
}

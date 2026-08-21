import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as articleItem from "@/app/api/articles/[id]/route";
import * as articles from "@/app/api/articles/route";
import * as bookItem from "@/app/api/books/[id]/route";
import * as books from "@/app/api/books/route";
import * as writingItem from "@/app/api/writings/[id]/route";
import * as writings from "@/app/api/writings/route";
import * as sheets from "@/lib/sheets";

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ accessToken: "fake-token" })) }));

vi.mock("@/lib/sheets", () => ({
  listBooks: vi.fn(async () => [{ id: "從 listBooks 來的" }]),
  listArticles: vi.fn(async () => [{ id: "從 listArticles 來的" }]),
  listWritings: vi.fn(async () => [{ id: "從 listWritings 來的" }]),
  addBookRow: vi.fn(async () => undefined),
  addArticleRow: vi.fn(async () => undefined),
  addWritingRow: vi.fn(async () => undefined),
  updateBookRow: vi.fn(async () => undefined),
  updateArticleRow: vi.fn(async () => undefined),
  updateWritingRow: vi.fn(async () => undefined),
  deleteBookRow: vi.fn(async () => undefined),
  deleteArticleRow: vi.fn(async () => undefined),
  deleteWritingRow: vi.fn(async () => undefined),
  readPrivacySettings: vi.fn(async () => ({ stored: "", privateKinds: [], privateTypes: [] })),
}));

const SHEET = "sheet-1";

/**
 * 六支 route 到 sheets 函式的接線。工廠本身的行為在 collectionRoute.test.ts，
 * 這裡只驗「books/route.ts 有沒有把三個字串填對」——型別檢查對這件事是盲的。
 */
const cases = [
  { name: "books", plural: "books", singular: "book", mod: books, item: bookItem },
  { name: "articles", plural: "articles", singular: "article", mod: articles, item: articleItem },
  { name: "writings", plural: "writings", singular: "writing", mod: writings, item: writingItem },
] as const;

const fns = sheets as unknown as Record<string, ReturnType<typeof vi.fn>>;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const url = () => `http://localhost/api/x?sheetId=${SHEET}`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe.each(cases)("$name", ({ plural, singular, mod, item }) => {
  const params = Promise.resolve({ id: "r1" });

  it(`GET 把資料包在 ${plural} 底下，而且來自 list${cap(plural)}`, async () => {
    const res = await mod.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ [plural]: [{ id: `從 list${cap(plural)} 來的` }] });
  });

  it(`POST 讀 body 的 ${singular}，交給 add${cap(singular)}Row`, async () => {
    const record = { id: "r1", 記號: singular };

    const res = await mod.POST(
      new NextRequest(url(), {
        method: "POST",
        body: JSON.stringify({ sheetId: SHEET, [singular]: record }),
      }),
    );

    expect(res.status).toBe(200);
    expect(fns[`add${cap(singular)}Row`]).toHaveBeenCalledWith(SHEET, "fake-token", record);
  });

  it(`PATCH 交給 update${cap(singular)}Row`, async () => {
    const patch = { 記號: singular };

    const res = await item.PATCH(
      new NextRequest(url(), { method: "PATCH", body: JSON.stringify({ sheetId: SHEET, patch }) }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(fns[`update${cap(singular)}Row`]).toHaveBeenCalledWith(SHEET, "fake-token", "r1", patch);
  });

  it(`DELETE 交給 delete${cap(singular)}Row`, async () => {
    const res = await item.DELETE(new NextRequest(url(), { method: "DELETE" }), { params });

    expect(res.status).toBe(200);
    expect(fns[`delete${cap(singular)}Row`]).toHaveBeenCalledWith(SHEET, "fake-token", "r1");
  });
});

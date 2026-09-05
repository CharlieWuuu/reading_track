import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as articleItem from "@/app/api/articles/[id]/route";
import * as articles from "@/app/api/articles/route";
import * as bookItem from "@/app/api/books/[id]/route";
import * as books from "@/app/api/books/route";
import * as writingItem from "@/app/api/writings/[id]/route";
import * as writings from "@/app/api/writings/route";
import * as articleMutations from "@/lib/db/mutations/articles";
import * as bookMutations from "@/lib/db/mutations/books";
import * as writingMutations from "@/lib/db/mutations/writings";

const USER_ID = "u1";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: USER_ID, name: "測試" } })),
}));

vi.mock("@/lib/db/queries/books", () => ({
  listBooks: vi.fn(async () => [{ id: "從 listBooks 來的" }]),
}));
vi.mock("@/lib/db/queries/articles", () => ({
  listArticles: vi.fn(async () => [{ id: "從 listArticles 來的" }]),
}));
vi.mock("@/lib/db/queries/writings", () => ({
  listWritings: vi.fn(async () => [{ id: "從 listWritings 來的" }]),
}));
vi.mock("@/lib/db/mutations/books", () => ({
  addBookRow: vi.fn(async () => undefined),
  updateBookRow: vi.fn(async () => undefined),
  deleteBookRow: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db/mutations/articles", () => ({
  addArticleRow: vi.fn(async () => undefined),
  updateArticleRow: vi.fn(async () => undefined),
  deleteArticleRow: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db/mutations/writings", () => ({
  addWritingRow: vi.fn(async () => undefined),
  updateWritingRow: vi.fn(async () => undefined),
  deleteWritingRow: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db/queries/settings", () => ({
  readPrivacySettings: vi.fn(async () => ({
    stored: "",
    privateKinds: [],
    privateTypes: [],
    privateKeywords: [],
  })),
}));

/**
 * 六支 route 到資料層函式的接線。工廠本身的行為在 collection-route.test.ts，
 * 這裡只驗「books/route.ts 有沒有把三個字串填對」——型別檢查對這件事是盲的。
 */
const cases = [
  {
    name: "books",
    plural: "books",
    singular: "book",
    mod: books,
    item: bookItem,
    fns: bookMutations,
  },
  {
    name: "articles",
    plural: "articles",
    singular: "article",
    mod: articles,
    item: articleItem,
    fns: articleMutations,
  },
  {
    name: "writings",
    plural: "writings",
    singular: "writing",
    mod: writings,
    item: writingItem,
    fns: writingMutations,
  },
] as const;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const url = () => "http://localhost/api/x";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe.each(cases)("$name", ({ plural, singular, mod, item, fns }) => {
  const params = Promise.resolve({ id: "r1" });
  const mutations = fns as unknown as Record<string, ReturnType<typeof vi.fn>>;

  it(`GET 把資料包在 ${plural} 底下，而且來自 list${cap(plural)}`, async () => {
    const res = await mod.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ [plural]: [{ id: `從 list${cap(plural)} 來的` }] });
  });

  it(`POST 讀 body 的 ${singular}，交給 add${cap(singular)}Row`, async () => {
    const record = { id: "r1", 記號: singular };

    const res = await mod.POST(
      new NextRequest(url(), { method: "POST", body: JSON.stringify({ [singular]: record }) }),
    );

    expect(res.status).toBe(200);
    expect(mutations[`add${cap(singular)}Row`]).toHaveBeenCalledWith(USER_ID, record);
  });

  it(`PATCH 交給 update${cap(singular)}Row`, async () => {
    const patch = { 記號: singular };

    const res = await item.PATCH(
      new NextRequest(url(), { method: "PATCH", body: JSON.stringify({ patch }) }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(mutations[`update${cap(singular)}Row`]).toHaveBeenCalledWith(USER_ID, "r1", patch);
  });

  it(`DELETE 交給 delete${cap(singular)}Row`, async () => {
    const res = await item.DELETE(new NextRequest(url(), { method: "DELETE" }), { params });

    expect(res.status).toBe(200);
    expect(mutations[`delete${cap(singular)}Row`]).toHaveBeenCalledWith(USER_ID, "r1");
  });
});

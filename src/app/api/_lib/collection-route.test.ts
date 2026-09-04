import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCollectionRoute } from "@/app/api/_lib/collection-route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ accessToken: "fake-token" })),
}));

// GET 一定會讀私人清單：鎖著的時候正是要用它過濾
vi.mock("@/lib/db/queries/settings", () => ({
  readPrivacySettings: vi.fn(async () => ({
    stored: "",
    privateKinds: ["日記"],
    privateTypes: ["政治"],
    privateKeywords: ["祕密"],
  })),
}));

type Row = { id: string; private?: string; kind?: string; domain?: string; keywords?: string };

const url = () => "http://localhost/api/books";
const post = (body: string) => new NextRequest(url(), { method: "POST", body });

/** rows 給陣列就正常回傳，給函式就讓它拋 */
function build(rows: Row[] | (() => never) = []) {
  const add = vi.fn(async () => undefined);
  const list = vi.fn(async () => (typeof rows === "function" ? rows() : rows));
  const route = createCollectionRoute<Row>({ key: "books", itemKey: "book", list, add });
  return { list, add, route };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("POST 的鍵名接線", () => {
  // itemKey 打錯的話型別檢查抓不到，只有這個測試會抓到
  it("把 body 裡 book 那一筆原封不動交給 add", async () => {
    const { add, route } = build();
    const book: Row = { id: "b1" };

    const res = await route.POST(post(JSON.stringify({ book })));

    expect(res.status).toBe(200);
    expect(add).toHaveBeenCalledWith(book);
  });

  it("body 裡沒有 book 就回 400，不去碰 Sheet", async () => {
    const { add, route } = build();

    const res = await route.POST(post(JSON.stringify({})));

    expect(res.status).toBe(400);
    expect(add).not.toHaveBeenCalled();
  });

  it("壞掉的 JSON 回 400 而不是整支炸掉", async () => {
    const { add, route } = build();

    const res = await route.POST(post("{ 這不是 JSON"));

    expect(res.status).toBe(400);
    expect(add).not.toHaveBeenCalled();
  });
});

describe("GET", () => {
  it("回應包在複數的鍵底下", async () => {
    const { route } = build([{ id: "b1" }]);

    const res = await route.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ books: [{ id: "b1" }] });
  });

  it("沒解鎖時私人的那筆不會離開伺服器", async () => {
    const { route } = build([{ id: "b1" }, { id: "b2", private: "是" }]);

    const res = await route.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ books: [{ id: "b1" }] });
  });

  it("類型標了私人的那筆也不會離開伺服器", async () => {
    const { route } = build([
      { id: "b1", domain: "文學" },
      { id: "b2", domain: "政治" },
    ]);

    const res = await route.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ books: [{ id: "b1", domain: "文學" }] });
  });

  it("掛了私人關鍵字的那筆也不會離開伺服器", async () => {
    const { route } = build([
      { id: "b1", keywords: "東京" },
      { id: "b2", keywords: "東京\n祕密" },
    ]);

    const res = await route.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ books: [{ id: "b1", keywords: "東京" }] });
  });

  it("書寫的類型標了私人的那筆也不會離開伺服器", async () => {
    const { route } = build([
      { id: "b1", kind: "書籍" },
      { id: "b2", kind: "日記" },
    ]);

    const res = await route.GET(new NextRequest(url()));

    expect(await res.json()).toEqual({ books: [{ id: "b1", kind: "書籍" }] });
  });
});

describe("失敗", () => {
  it("Sheet 拋錯回 502", async () => {
    const { route } = build(() => {
      throw new Error("boom");
    });

    const res = await route.GET(new NextRequest(url()));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "讀取 Sheet 失敗" });
  });

  it("配額爆掉回 429 而不是 502", async () => {
    const { route } = build(() => {
      throw Object.assign(new Error("quota"), { response: { status: 429 } });
    });

    const res = await route.GET(new NextRequest(url()));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCollectionRoute } from "@/app/api/_lib/collection-route";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ accessToken: "fake-token" })),
}));

// GET 一定會去讀設定分頁（私人類型清單鎖著的時候正是要用它）
vi.mock("@/lib/sheets", () => ({
  readPrivacySettings: vi.fn(async () => ({ stored: "", privateKinds: ["日記"] })),
}));

type Row = { id: string; private?: string; kind?: string };

const SHEET = "sheet-1";
const url = () => `http://localhost/api/books?sheetId=${SHEET}`;
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

    const res = await route.POST(post(JSON.stringify({ sheetId: SHEET, book })));

    expect(res.status).toBe(200);
    expect(add).toHaveBeenCalledWith(SHEET, "fake-token", book);
  });

  it("body 裡沒有 book 就回 400，不去碰 Sheet", async () => {
    const { add, route } = build();

    const res = await route.POST(post(JSON.stringify({ sheetId: SHEET })));

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

  it("類型在私人清單裡的那筆也不會離開伺服器", async () => {
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

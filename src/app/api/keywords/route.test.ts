import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as keywords from "@/app/api/keywords/route";
import * as fragmentMutations from "@/lib/db/mutations/fragments";
import { EMPTY_KEYWORD_INFO, KeywordInfo } from "@/types/keyword";

const USER_ID = "u1";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: USER_ID, name: "測試" } })),
}));

vi.mock("@/lib/db/queries/fragments", () => ({
  listKeywords: vi.fn(async () => [{ name: "從 listKeywords 來的" }]),
}));
vi.mock("@/lib/db/mutations/fragments", () => ({
  replaceKeywordInfo: vi.fn(async () => undefined),
  renameKeyword: vi.fn(async () => 0),
  deleteKeyword: vi.fn(async () => 3),
}));

/**
 * 關鍵字 route 到資料層函式的接線。
 *
 * 這支不吃 createCollectionRoute（關鍵字靠名字認人，沒有 [id]），所以 wiring.test
 * 那輪涵蓋不到——handler 整支不見時型別檢查與 lint 都不會擋，只有這裡會。
 */
const url = () => "http://localhost/api/keywords";

const infoOf = (name: string): KeywordInfo => ({
  id: name,
  name,
  createdAt: "",
  ...EMPTY_KEYWORD_INFO,
});

const put = (body: unknown) =>
  keywords.PUT(new NextRequest(url(), { method: "PUT", body: JSON.stringify(body) }));

const del = (body: unknown) =>
  keywords.DELETE(new NextRequest(url(), { method: "DELETE", body: JSON.stringify(body) }));

const mutations = fragmentMutations as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("keywords GET", () => {
  it("把資料包在 keywords 底下，而且來自 listKeywords", async () => {
    const res = await keywords.GET();

    expect(await res.json()).toEqual({ keywords: [{ name: "從 listKeywords 來的" }] });
  });
});

describe("keywords PUT", () => {
  it("整列交給 replaceKeywordInfo", async () => {
    const keyword = infoOf("巴洛克");

    const res = await put({ keyword, previousName: "巴洛克" });

    expect(res.status).toBe(200);
    expect(mutations.replaceKeywordInfo).toHaveBeenCalledWith(USER_ID, keyword);
  });

  it("名字沒變就不動 renameKeyword", async () => {
    await put({ keyword: infoOf("巴洛克"), previousName: "巴洛克" });

    expect(mutations.renameKeyword).not.toHaveBeenCalled();
  });

  it("名字變了先改名再寫入", async () => {
    await put({ keyword: infoOf("巴洛克"), previousName: "巴羅克" });

    expect(mutations.renameKeyword).toHaveBeenCalledWith(USER_ID, "巴羅克", "巴洛克");
    expect(mutations.replaceKeywordInfo).toHaveBeenCalled();
  });

  it("沒有名字就擋下來", async () => {
    const res = await put({ keyword: infoOf("   ") });

    expect(res.status).toBe(400);
    expect(mutations.replaceKeywordInfo).not.toHaveBeenCalled();
  });
});

describe("keywords DELETE", () => {
  it("交給 deleteKeyword，回傳動到幾條連結", async () => {
    const res = await del({ name: "巴洛克" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ removed: 3 });
    expect(mutations.deleteKeyword).toHaveBeenCalledWith(USER_ID, "巴洛克");
  });

  it("沒有名字就擋下來", async () => {
    const res = await del({});

    expect(res.status).toBe(400);
    expect(mutations.deleteKeyword).not.toHaveBeenCalled();
  });
});

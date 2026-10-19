import { describe, expect, it, vi } from "vitest";
import { runSources } from "./index";

const books = vi.fn();
const wiki = vi.fn();
const web = vi.fn();
vi.mock("./books", () => ({ lookupBook: (...a: unknown[]) => books(...a) }));
vi.mock("./web", () => ({ lookupWeb: (...a: unknown[]) => web(...a) }));
vi.mock("./wikipedia", () => ({ lookupWikipedia: (...a: unknown[]) => wiki(...a) }));

describe("runSources", () => {
  it("依序問，第一個查到的為止", async () => {
    books.mockResolvedValue(null);
    wiki.mockResolvedValue({ body: "摘要" });

    const found = await runSources(["taaze", "wikipedia"], { title: "x" });

    expect(found).toEqual({ source: "wikipedia", fields: { body: "摘要" } });
  });

  it("前面查到就不問後面", async () => {
    books.mockResolvedValue({ creator: "甲" });
    wiki.mockClear();

    await runSources(["taaze", "wikipedia"], { title: "x" });

    expect(wiki).not.toHaveBeenCalled();
  });

  it("來源壞掉換下一個", async () => {
    books.mockRejectedValue(new Error("配額"));
    wiki.mockResolvedValue({ body: "摘要" });

    expect((await runSources(["taaze", "wikipedia"], { title: "x" }))?.source).toBe("wikipedia");
  });

  it("全部沒結果回 null，有壞掉的就丟錯", async () => {
    books.mockResolvedValue(null);
    wiki.mockResolvedValue(null);
    expect(await runSources(["taaze", "wikipedia"], { title: "x" })).toBeNull();

    books.mockRejectedValue(new Error("配額"));
    await expect(runSources(["taaze", "wikipedia"], { title: "x" })).rejects.toThrow("配額");
  });

  it("網頁來源用網址，沒有網址就略過", async () => {
    web.mockResolvedValue({ title: "文章" });
    books.mockClear();

    expect(await runSources(["taaze", "web"], { url: "https://x" })).toEqual({
      source: "web",
      fields: { title: "文章" },
    });
    expect(books).not.toHaveBeenCalled();

    web.mockClear();
    expect(await runSources(["web"], { title: "x" })).toBeNull();
    expect(web).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import { runSources } from "./index";

const books = vi.fn();
const wiki = vi.fn();
vi.mock("./books", () => ({ lookupBook: (...a: unknown[]) => books(...a) }));
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
});

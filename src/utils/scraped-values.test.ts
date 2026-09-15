import { describe, expect, it } from "vitest";
import { fillFromBook } from "./scraped-values";

const ALL = new Set(["title", "creator", "source", "externalId", "coverUrl", "amount"]);

describe("fillFromBook", () => {
  it("爬回來的舊欄名換成表單認得的欄位鍵", () => {
    const { values } = fillFromBook(
      {},
      { author: "村上春樹", publisher: "時報", isbn: "978" },
      ALL,
    );
    expect(values.creator).toBe("村上春樹");
    expect(values.source).toBe("時報");
    expect(values.externalId).toBe("978");
  });

  it("已經填了的不蓋掉——手動改過的比抓回來的可信", () => {
    const { values, filled } = fillFromBook({ creator: "我自己打的" }, { author: "爬蟲說的" }, ALL);
    expect(values.creator).toBe("我自己打的");
    expect(filled).toBe(0);
  });

  it("這個類型沒勾的欄位不補，表單上根本沒那一格", () => {
    const { values, filled } = fillFromBook({}, { isbn: "978" }, new Set(["title"]));
    expect(values.externalId).toBeUndefined();
    expect(filled).toBe(0);
  });

  it("空字串不算抓到", () => {
    const { filled } = fillFromBook({}, { author: "  ", publisher: "" }, ALL);
    expect(filled).toBe(0);
  });

  it("回報補了幾格", () => {
    const { filled } = fillFromBook({ title: "有了" }, { title: "別的", author: "A" }, ALL);
    expect(filled).toBe(1);
  });
});

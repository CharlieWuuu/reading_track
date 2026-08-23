import { describe, expect, it } from "vitest";
import { resolveView, statsHref, viewsFor } from "./stats-views";

describe("resolveView", () => {
  it("類型畫得出來就照網址走", () => {
    expect(resolveView("books", "timeline")).toBe("timeline");
  });

  it("這個類型沒有的看法退回圖表，不留空畫面", () => {
    expect(resolveView("articles", "timeline")).toBe("chart");
    expect(resolveView("writing", "timeline")).toBe("chart");
  });

  it("沒帶參數就是圖表", () => {
    expect(resolveView("books", null)).toBe("chart");
  });
});

describe("viewsFor", () => {
  it("只列這個類型畫得出來的，順序照 STATS_VIEWS", () => {
    expect(viewsFor("books").map((v) => v.key)).toEqual(["chart", "calendar", "timeline"]);
    expect(viewsFor("writing").map((v) => v.key)).toEqual(["chart", "calendar"]);
  });
});

describe("statsHref", () => {
  it("預設的看法不寫進網址", () => {
    expect(statsHref("books", "chart")).toBe("/stats/books");
  });

  it("其餘的帶 view 參數", () => {
    expect(statsHref("books", "calendar")).toBe("/stats/books?view=calendar");
  });
});

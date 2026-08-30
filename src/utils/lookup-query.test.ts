import { describe, expect, it } from "vitest";
import { parseLookupQuery } from "./lookup-query";

describe("parseLookupQuery", () => {
  it("空的就是沒有查詢", () => {
    expect(parseLookupQuery("   ")).toBeNull();
  });

  it("完整網址原樣帶走", () => {
    expect(parseLookupQuery(" https://readmoo.com/book/123 ")).toEqual({
      kind: "url",
      url: "https://readmoo.com/book/123",
    });
  });

  it("少了通訊協定也算網址", () => {
    expect(parseLookupQuery("readmoo.com/book/123")).toEqual({
      kind: "url",
      url: "https://readmoo.com/book/123",
    });
  });

  it("書名裡有句點但不像網域，仍然是書名", () => {
    expect(parseLookupQuery("國富論 第 2 版")).toEqual({ kind: "title", title: "國富論 第 2 版" });
    expect(parseLookupQuery("1984.")).toEqual({ kind: "title", title: "1984." });
  });
});

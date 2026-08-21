import { describe, expect, it } from "vitest";
import { makeBook, resetIds } from "@/testing/factories";
import { validateBook, validateBooks } from "./validate-book";

resetIds();

const fields = (book: Parameters<typeof validateBook>[0]) =>
  validateBook(book).map((issue) => issue.field);

describe("validateBook", () => {
  it("乾淨的一本書沒有任何問題", () => {
    expect(validateBook(makeBook())).toEqual([]);
  });

  it("沒書名會被指出來", () => {
    expect(fields(makeBook({ title: "   " }))).toEqual(["title"]);
  });

  it("沒書名時用「（未命名書籍）」當標題，訊息才不會空一塊", () => {
    expect(validateBook(makeBook({ title: "" }))[0].title).toBe("（未命名書籍）");
  });

  it("日期格式不對會被指出來", () => {
    expect(fields(makeBook({ startDate: "2026/08/01" }))).toEqual(["startDate"]);
  });

  // 2 月 30 日長得像合法格式，要真的當日期算過才知道不存在
  it("不存在的日期也算格式不對", () => {
    expect(fields(makeBook({ endDate: "2026-02-30" }))).toEqual(["endDate"]);
  });

  it("完成日期早於開始日期會被指出來", () => {
    expect(fields(makeBook({ startDate: "2026-08-10", endDate: "2026-08-01" }))).toEqual([
      "endDate",
    ]);
  });

  // 兩個日期本身就壞了的時候，先後順序沒有意義，不該再多報一條
  it("日期壞掉時不另外報先後順序", () => {
    expect(fields(makeBook({ startDate: "壞的", endDate: "2026-08-01" }))).toEqual(["startDate"]);
  });

  it("沒填日期不算問題", () => {
    expect(validateBook(makeBook({ startDate: null, endDate: null }))).toEqual([]);
  });

  it("頁數不是數字會被指出來", () => {
    expect(fields(makeBook({ pageCount: "三百" }))).toEqual(["pageCount"]);
  });

  it("千分位逗號是允許的", () => {
    expect(validateBook(makeBook({ wordCount: "120,000" }))).toEqual([]);
  });

  it("來源網址不是連結會被指出來", () => {
    expect(fields(makeBook({ sourceUrl: "readmoo.com" }))).toEqual(["sourceUrl"]);
  });

  it("一本書可以同時有很多個問題", () => {
    expect(fields(makeBook({ title: "", pageCount: "三百", sourceUrl: "x" }))).toEqual([
      "title",
      "pageCount",
      "sourceUrl",
    ]);
  });
});

describe("validateBooks", () => {
  it("把每一本的問題串成一份清單，各自帶著自己的編號", () => {
    const issues = validateBooks([
      makeBook({ id: "b1", title: "" }),
      makeBook({ id: "b2" }),
      makeBook({ id: "b3", pageCount: "三百" }),
    ]);

    expect(issues.map((i) => i.bookId)).toEqual(["b1", "b3"]);
  });
});

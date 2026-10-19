import { describe, expect, it } from "vitest";
import { fromAutofillSources, parseAutofill, toAutofillSources } from "./autofill-sources";

describe("autofill sources", () => {
  it("字串來回，順序保留", () => {
    expect(toAutofillSources("wikipedia,books")).toEqual(["wikipedia", "books"]);
    expect(fromAutofillSources(["books", "wikipedia"])).toBe("books,wikipedia");
  });

  it("空字串是沒有來源", () => {
    expect(toAutofillSources("")).toEqual([]);
  });

  it("已下架的 slug 丟掉", () => {
    expect(toAutofillSources("books,gone")).toEqual(["books"]);
    expect(fromAutofillSources(["gone"])).toBe("");
  });

  it("API 收到不是陣列就當沒勾", () => {
    expect(parseAutofill("books")).toEqual([]);
    expect(parseAutofill(["books", 1, "x"])).toEqual(["books"]);
  });
});

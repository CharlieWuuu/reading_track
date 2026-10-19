import { describe, expect, it } from "vitest";
import { fromAutofillSources, parseAutofill, toAutofillSources } from "./autofill-sources";

describe("autofill sources", () => {
  it("字串來回，順序保留", () => {
    expect(toAutofillSources("wikipedia,taaze")).toEqual(["taaze", "wikipedia"]);
    expect(fromAutofillSources(["taaze", "wikipedia"])).toBe("taaze,wikipedia");
  });

  it("空字串是沒有來源", () => {
    expect(toAutofillSources("")).toEqual([]);
  });

  it("已下架的 slug 丟掉", () => {
    expect(toAutofillSources("taaze,gone")).toEqual(["taaze"]);
    expect(fromAutofillSources(["gone"])).toBe("");
  });

  it("API 收到不是陣列就當沒勾", () => {
    expect(parseAutofill("taaze")).toEqual([]);
    expect(parseAutofill(["taaze", 1, "x"])).toEqual(["taaze"]);
  });
});

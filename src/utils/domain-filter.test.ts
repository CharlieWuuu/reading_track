import { describe, expect, it } from "vitest";
import { domainsOf, inDomain, sortDomains } from "./domain-filter";

describe("sortDomains", () => {
  it("去重、去空、排序", () => {
    expect(sortDomains(["程式", "", "人文社科", "程式"])).toEqual(
      ["人文社科", "程式"].sort((a, b) => a.localeCompare(b, "zh-Hant")),
    );
  });
});

describe("domainsOf", () => {
  it("從資料取出用到的領域", () => {
    const rows = [{ domain: "程式" }, { domain: "" }, { domain: "程式" }];
    expect(domainsOf(rows)).toEqual(["程式"]);
  });
});

describe("inDomain", () => {
  const rows = [{ domain: "程式" }, { domain: "語言學習" }, { domain: "" }];

  it("沒選就全部", () => {
    expect(rows.filter(inDomain(null))).toHaveLength(3);
  });

  it("只留選到的那個領域", () => {
    expect(rows.filter(inDomain("程式"))).toEqual([{ domain: "程式" }]);
  });
});

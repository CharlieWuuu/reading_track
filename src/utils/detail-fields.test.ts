import { describe, expect, it } from "vitest";
import { Kind } from "@/lib/db/queries/kinds";
import { factFields, longFields } from "@/utils/detail-fields";

const kind = {
  modules: ["title", "creator", "longText", "cover", "language", "endDate"].map((key, i) => ({
    key,
    label: key === "creator" ? "作者" : key,
    sortOrder: i,
  })),
} as unknown as Kind;

describe("factFields", () => {
  it("勾了的欄位都列，空的也列", () => {
    const keys = factFields(kind, { title: "書名" }).map((entry) => entry.key);
    expect(keys).toEqual(["creator", "body", "coverUrl", "language", "endDate", "isPrivate"]);
  });

  it("別處畫過（有值）的不重複列，沒值的照列", () => {
    const values = { creator: "卡繆", body: "內文", coverUrl: "k", language: "" };
    const keys = factFields(kind, values, new Set(["creator", "language"])).map((e) => e.key);
    expect(keys).toEqual(["language", "endDate", "isPrivate"]);
  });

  it("私人寫成是／否，名字用設定頁的", () => {
    const entries = factFields(kind, { isPrivate: "是" });
    expect(entries.find((e) => e.key === "isPrivate")?.value).toBe("是");
    expect(factFields(kind, {}).find((e) => e.key === "isPrivate")?.value).toBe("否");
    expect(entries.find((e) => e.key === "creator")?.label).toBe("作者");
  });
});

describe("longFields", () => {
  it("只有填了的長文", () => {
    expect(longFields(kind, { body: "" })).toEqual([]);
    expect(longFields(kind, { body: "內文" }).map((e) => e.value)).toEqual(["內文"]);
  });
});

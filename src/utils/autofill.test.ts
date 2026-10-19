import { describe, expect, it } from "vitest";
import { fillFields, missingInput, usableSources } from "./autofill";

const ALL = new Set(["title", "body", "externalUrl"]);

describe("fillFields", () => {
  it("補進空欄位並回報格數", () => {
    const { values, filled } = fillFields({}, { body: "摘要", externalUrl: "https://x" }, ALL);
    expect(values).toEqual({ body: "摘要", externalUrl: "https://x" });
    expect(filled).toBe(2);
  });

  it("已經填了的不蓋掉", () => {
    const { values, filled } = fillFields({ body: "我寫的" }, { body: "查到的" }, ALL);
    expect(values.body).toBe("我寫的");
    expect(filled).toBe(0);
  });

  it("這個類型沒勾的欄位不補", () => {
    const { values, filled } = fillFields({}, { body: "摘要" }, new Set(["title"]));
    expect(values.body).toBeUndefined();
    expect(filled).toBe(0);
  });

  it("空白與 undefined 不算查到", () => {
    expect(fillFields({}, { body: "  ", externalUrl: undefined }, ALL).filled).toBe(0);
  });

  it("不改傳入的值", () => {
    const current = { title: "a" };
    fillFields(current, { body: "x" }, ALL);
    expect(current).toEqual({ title: "a" });
  });
});

describe("usableSources", () => {
  it("書名來源要標題，網頁來源要網址", () => {
    expect(usableSources(["taaze", "web"], { title: "書" })).toEqual(["taaze"]);
    expect(usableSources(["taaze", "web"], { url: "https://x" })).toEqual(["web"]);
    expect(usableSources(["taaze", "web"], { title: "書", url: "https://x" })).toEqual([
      "taaze",
      "web",
    ]);
  });

  it("空白不算有", () => {
    expect(usableSources(["taaze"], { title: "  " })).toEqual([]);
  });
});

describe("missingInput", () => {
  it("有得查回 null", () => {
    expect(missingInput(["taaze"], { title: "書" })).toBeNull();
  });

  it("有書名來源就提示標題，全是網頁來源才提示外部連結", () => {
    expect(missingInput(["taaze", "web"], {})).toBe("標題");
    expect(missingInput(["web"], { title: "書" })).toBe("外部連結");
  });
});

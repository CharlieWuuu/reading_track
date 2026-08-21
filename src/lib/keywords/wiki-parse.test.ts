import { describe, expect, it } from "vitest";
import { WikidataClaim, WikiPage } from "@/types/wiki";
import { pickCoordinate, summarize, year } from "./wiki-parse";

const page = (coordinates?: WikiPage["coordinates"]): WikiPage => ({
  title: "臺北市",
  coordinates,
});

const claim = (time: string): WikidataClaim[] => [{ mainsnak: { datavalue: { value: { time } } } }];

describe("pickCoordinate", () => {
  it("有主座標就用主座標", () => {
    const picked = pickCoordinate(
      page([
        { lat: 1, lon: 1 },
        { lat: 25, lon: 121, primary: true },
      ]),
    );

    expect(picked).toEqual({ lat: 25, lon: 121, primary: true });
  });

  it("沒有主座標就用第一個", () => {
    expect(pickCoordinate(page([{ lat: 1, lon: 1 }]))).toEqual({ lat: 1, lon: 1 });
  });

  it("整個沒有座標回 undefined", () => {
    expect(pickCoordinate(page())).toBeUndefined();
    expect(pickCoordinate(page([]))).toBeUndefined();
  });
});

describe("summarize", () => {
  it("只留第一段", () => {
    expect(summarize("第一段。\n\n第二段。")).toBe("第一段。");
  });

  it("跳過開頭的空行", () => {
    expect(summarize("\n\n真正的第一段")).toBe("真正的第一段");
  });

  it("段內換行與多餘空白收成單一空白", () => {
    expect(summarize("前  段\t後段")).toBe("前 段 後段");
  });

  it("超過長度就截斷加刪節號", () => {
    const long = "字".repeat(250);

    const text = summarize(long);

    expect(text).toHaveLength(201); // 200 字 + 刪節號
    expect(text.endsWith("…")).toBe(true);
  });

  it("剛好 200 字不截斷", () => {
    const exact = "字".repeat(200);

    expect(summarize(exact)).toBe(exact);
  });

  it("空字串回空字串", () => {
    expect(summarize("")).toBe("");
  });
});

describe("year", () => {
  it("取西元年，去掉月日與前導零", () => {
    expect(year(claim("+1809-02-12T00:00:00Z"))).toBe("1809");
  });

  it("負號是西元前", () => {
    expect(year(claim("-0044-03-15T00:00:00Z"))).toBe("-44");
  });

  it("沒有 claim 回空字串", () => {
    expect(year(undefined)).toBe("");
    expect(year([])).toBe("");
  });

  it("形狀不對也不會炸", () => {
    expect(year([{}])).toBe("");
    expect(year(claim("不是時間"))).toBe("");
  });
});

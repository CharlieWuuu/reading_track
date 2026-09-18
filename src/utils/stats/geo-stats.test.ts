import { describe, expect, it } from "vitest";
import { eraSpans, geoPoints } from "./geo-stats";

describe("geoPoints", () => {
  it("兩格座標都有才是一個點", () => {
    const rows = [
      { title: "巴黎", latitude: "48.85", longitude: "2.35" },
      { title: "沒座標", latitude: "", longitude: "" },
      { title: "只有一格", latitude: "35.01", longitude: "" },
    ];
    expect(geoPoints(rows)).toEqual([{ name: "巴黎", lat: 48.85, lon: 2.35 }]);
  });

  it("認不得的數字當沒填", () => {
    expect(geoPoints([{ title: "壞的", latitude: "亂寫", longitude: "2.35" }])).toEqual([]);
  });

  it("零是有效座標——赤道與本初子午線不是沒填", () => {
    expect(geoPoints([{ title: "原點", latitude: "0", longitude: "0" }])).toHaveLength(1);
  });
});

describe("eraSpans", () => {
  it("有起訖年畫成一段", () => {
    const [span] = eraSpans([{ title: "馬克思", startYear: "1818", endYear: "1883" }]);
    expect(span).toEqual({ name: "馬克思", from: 1818, to: 1883, point: false });
  });

  it("只有起始年畫成一個點——還在持續，或只知道生年", () => {
    const [span] = eraSpans([{ title: "某人", startYear: "1990", endYear: "" }]);
    expect(span).toMatchObject({ from: 1990, to: 1990, point: true });
  });

  it("只有結束年不畫——一段要有起點", () => {
    expect(eraSpans([{ title: "只有卒年", startYear: "", endYear: "1883" }])).toEqual([]);
  });

  it("照起始年排", () => {
    const names = eraSpans([
      { title: "後", startYear: "1900" },
      { title: "先", startYear: "1800" },
    ]).map((s) => s.name);
    expect(names).toEqual(["先", "後"]);
  });

  it("西元前的負年份照樣排得對", () => {
    const names = eraSpans([
      { title: "後", startYear: "100" },
      { title: "先", startYear: "-400" },
    ]).map((s) => s.name);
    expect(names).toEqual(["先", "後"]);
  });
});

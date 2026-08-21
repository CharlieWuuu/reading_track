import { describe, expect, it } from "vitest";
import { makeWriting, resetIds } from "@/testing/factories";
import { groupByWeek, isUrl, journalToReflections, type Reflection } from "./reflections";

resetIds();

describe("isUrl", () => {
  it("認 http 與 https", () => {
    expect(isUrl("https://example.com")).toBe(true);
    expect(isUrl("http://example.com")).toBe(true);
  });

  it("前後空白不影響", () => {
    expect(isUrl("  https://example.com  ")).toBe(true);
  });

  it("純文字的來源不是連結", () => {
    expect(isUrl("紙本日記 8/17")).toBe(false);
    expect(isUrl("")).toBe(false);
  });
});

describe("journalToReflections", () => {
  it("預設只收有寫心得的", () => {
    const writings = [makeWriting({ note: "寫了一句話" }), makeWriting({ note: "   " })];

    expect(journalToReflections(writings)).toHaveLength(1);
  });

  it("requireNote false 就全收", () => {
    const writings = [makeWriting({ note: "寫了一句話" }), makeWriting({ note: "" })];

    expect(journalToReflections(writings, false)).toHaveLength(2);
  });

  it("關鍵字一行一個", () => {
    const writings = [makeWriting({ keywords: "專注\n習慣" })];

    expect(journalToReflections(writings)[0].keywords).toEqual(["專注", "習慣"]);
  });

  it("href 指回編輯頁，來源欄搬到 origin", () => {
    const writings = makeWriting({ link: "https://example.com/post" });

    const [reflection] = journalToReflections([writings]);

    expect(reflection.href).toBe(`/writing/${writings.id}/edit`);
    expect(reflection.origin).toBe("https://example.com/post");
    expect(reflection.source).toBe("紀事");
  });
});

const at = (date: string | null): Reflection => ({
  id: `r-${date ?? "none"}`,
  source: "紀事",
  title: "標題",
  date,
  note: "一句話",
  keywords: [],
  href: "#",
});

describe("groupByWeek", () => {
  it("同一週的併在一起，標籤是週一到週日", () => {
    const groups = groupByWeek([at("2026-08-17"), at("2026-08-23")]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: "2026-W34", label: "8/17–8/23", week: 34, year: 2026 });
    expect(groups[0].items).toHaveLength(2);
  });

  it("週日與隔天的週一分屬兩週", () => {
    const groups = groupByWeek([at("2026-08-23"), at("2026-08-24")]);

    expect(groups.map((g) => g.key)).toEqual(["2026-W35", "2026-W34"]);
  });

  it("由新到舊", () => {
    const groups = groupByWeek([at("2026-07-01"), at("2026-08-17")]);

    expect(groups.map((g) => g.key)).toEqual(["2026-W34", "2026-W27"]);
  });

  it("跨年那幾天跟著 ISO 週走", () => {
    // 2026-01-01 是週四，所以 2025-12-29 那一週算 2026 年第一週
    const groups = groupByWeek([at("2025-12-30"), at("2026-01-01")]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: "2026-W01", label: "12/29–1/4" });
  });

  it("沒日期的自成一組，排在最後", () => {
    const groups = groupByWeek([at(null), at("2026-08-17")]);

    expect(groups.map((g) => g.key)).toEqual(["2026-W34", ""]);
    expect(groups[1].label).toBe("未填日期");
  });

  it("日期帶時間也落到同一週", () => {
    const groups = groupByWeek([at("2026-08-17"), at("2026-08-18 14:32")]);

    expect(groups).toHaveLength(1);
  });
});

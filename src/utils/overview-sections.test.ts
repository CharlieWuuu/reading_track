import { describe, expect, it } from "vitest";
import { FragmentRow } from "@/lib/db/queries/catalog";
import { sectionsByKind } from "./overview-sections";

const row = (over: Partial<FragmentRow>): FragmentRow =>
  ({ id: "1", kindSlug: "quotes", kindName: "佳句", date: "2026-01-01", ...over }) as FragmentRow;

describe("sectionsByKind", () => {
  it("照類型分區，每區只留最近幾筆", () => {
    const sections = sectionsByKind(
      [
        row({ id: "a", kindSlug: "quotes", date: "2026-03-01" }),
        row({ id: "b", kindSlug: "quotes", date: "2026-02-01" }),
        row({ id: "c", kindSlug: "quotes", date: "2026-01-01" }),
        row({ id: "d", kindSlug: "words", kindName: "單字", date: "2026-02-15" }),
      ],
      { take: 2 },
    );

    expect(sections.map((s) => s.slug)).toEqual(["quotes", "words"]);
    expect(sections[0].rows.map((r) => r.id)).toEqual(["a", "b"]);
    expect(sections[0].total).toBe(3); // 總數是全部，不是露出來的那幾筆
  });

  it("最近有動靜的類型排前面", () => {
    const sections = sectionsByKind([
      row({ id: "a", kindSlug: "quotes", date: "2026-01-01" }),
      row({ id: "b", kindSlug: "words", kindName: "單字", date: "2026-05-01" }),
    ]);

    expect(sections.map((s) => s.slug)).toEqual(["words", "quotes"]);
  });

  it("當頭條的那一則不重複出現", () => {
    const sections = sectionsByKind(
      [row({ id: "head", date: "2026-03-01" }), row({ id: "rest", date: "2026-02-01" })],
      { exclude: "head" },
    );

    expect(sections[0].rows.map((r) => r.id)).toEqual(["rest"]);
    expect(sections[0].total).toBe(1);
  });

  it("沒填日期的排最後，不影響分區", () => {
    const sections = sectionsByKind([
      row({ id: "a", date: null, createdAt: "2026-01-01T00:00:00.000Z" }),
      row({ id: "b", date: "2026-04-01" }),
    ]);

    expect(sections[0].rows.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

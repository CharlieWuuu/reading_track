import { describe, expect, it } from "vitest";
import { byDateThenNewest } from "./record-order";

type Row = { createdAt: string; date: string | null; name: string };

const sort = (rows: Row[]) => [...rows].sort(byDateThenNewest<Row>((r) => r.date));

function row(name: string, date: string | null, createdAt: string): Row {
  return { name, date, createdAt };
}

describe("byDateThenNewest", () => {
  it("日期由新到舊", () => {
    const rows = sort([
      row("舊", "2026-01-01", "2026-01-01T00:00:00Z"),
      row("新", "2026-03-01", "2026-01-01T00:00:00Z"),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["新", "舊"]);
  });

  it("同一天比記錄時間，晚記的在前——本來這裡是比標題，順序看起來是亂的", () => {
    const rows = sort([
      row("先記的", "2026-03-01", "2026-03-01T09:00:00Z"),
      row("後記的", "2026-03-01", "2026-03-01T21:00:00Z"),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["後記的", "先記的"]);
  });

  it("沒填日期的排最後", () => {
    const rows = sort([
      row("沒日期", null, "2026-09-01T00:00:00Z"),
      row("有日期", "2026-01-01", "2026-01-01T00:00:00Z"),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["有日期", "沒日期"]);
  });

  it("沒填日期的彼此之間也照記錄時間排", () => {
    const rows = sort([
      row("先", null, "2026-01-01T00:00:00Z"),
      row("後", null, "2026-05-01T00:00:00Z"),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["後", "先"]);
  });
});

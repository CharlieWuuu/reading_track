import { describe, expect, it } from "vitest";
import type { RecordRow } from "@/lib/db/queries/catalog";
import { completeness, pickHeadline } from "./home-digest";

const row = (over: Partial<RecordRow>): RecordRow =>
  ({
    id: "x",
    title: "t",
    body: "",
    creator: "",
    publisher: "",
    amount: null,
    domain: "",
    subDomain: "",
    attribute: "",
    language: "",
    platform: "",
    coverUrl: "",
    startDate: null,
    endDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  }) as RecordRow;

const TODAY = "2026-10-07";

describe("pickHeadline", () => {
  it("近半年裡欄位最齊的勝出", () => {
    const sparse = row({ id: "a", body: "文", endDate: "2026-10-01" });
    const full = row({ id: "b", body: "文", creator: "人", coverUrl: "u", endDate: "2026-08-01" });
    expect(pickHeadline([sparse, full], TODAY)?.id).toBe("b");
  });

  it("同分取較近", () => {
    const old = row({ id: "a", body: "文", endDate: "2026-07-01" });
    const near = row({ id: "b", body: "文", endDate: "2026-09-01" });
    expect(pickHeadline([old, near], TODAY)?.id).toBe("b");
  });

  it("沒節錄的不選，即使欄位多", () => {
    const noBody = row({ id: "a", creator: "人", coverUrl: "u", endDate: "2026-10-01" });
    const withBody = row({ id: "b", body: "文", endDate: "2026-10-01" });
    expect(pickHeadline([noBody, withBody], TODAY)?.id).toBe("b");
  });

  it("近半年沒有就放寬到全部", () => {
    const old = row({ id: "a", body: "文", endDate: "2025-01-01" });
    expect(pickHeadline([old], TODAY)?.id).toBe("a");
  });

  it("全都沒節錄退回最近一筆", () => {
    const a = row({ id: "a", endDate: "2026-05-01" });
    const b = row({ id: "b", endDate: "2026-09-01" });
    expect(pickHeadline([a, b], TODAY)?.id).toBe("b");
  });

  it("沒資料回 undefined", () => {
    expect(pickHeadline([], TODAY)).toBeUndefined();
  });
});

describe("completeness", () => {
  it("數有填的欄位", () => {
    expect(completeness(row({ creator: "人", amount: 10 }))).toBe(2);
  });
});

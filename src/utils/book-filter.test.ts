import { describe, expect, it } from "vitest";
import { Book, ReadingStatus } from "@/types/book";
import {
  DEFAULT_STATUS,
  effectiveStatus,
  matchesStatus,
  parseStatusFilter,
  STATUS_LABELS,
  statusFromLabel,
  statusHeading,
  statusLabel,
} from "./book-filter";

const book = (status: ReadingStatus) => ({ status }) as Book;

describe("parseStatusFilter", () => {
  it.each(["all", "done", "reading", "want"] as const)("認得 %s", (raw) => {
    expect(parseStatusFilter(raw)).toBe(raw);
  });

  it.each([null, undefined, "", "已讀完", "亂寫"])("看不懂就回預設：%s", (raw) => {
    expect(parseStatusFilter(raw)).toBe(DEFAULT_STATUS);
  });

  it("預設看全部", () => {
    expect(DEFAULT_STATUS).toBe("all");
  });
});

describe("matchesStatus", () => {
  it("all 全都算", () => {
    for (const s of ["想讀", "閱讀中", "已讀完"] as ReadingStatus[]) {
      expect(matchesStatus(book(s), "all")).toBe(true);
    }
  });

  it("done 只留已讀完", () => {
    expect(matchesStatus(book("已讀完"), "done")).toBe(true);
    expect(matchesStatus(book("閱讀中"), "done")).toBe(false);
    expect(matchesStatus(book("想讀"), "done")).toBe(false);
  });

  it("reading 與 want 各認各的", () => {
    expect(matchesStatus(book("閱讀中"), "reading")).toBe(true);
    expect(matchesStatus(book("已讀完"), "reading")).toBe(false);
    expect(matchesStatus(book("想讀"), "want")).toBe(true);
  });
});

describe("effectiveStatus", () => {
  it("搜尋中一律看全部，免得以為那本書不見了", () => {
    expect(effectiveStatus("done", true)).toBe("all");
    expect(effectiveStatus("want", true)).toBe("all");
  });

  it("沒在搜尋就照使用者選的", () => {
    expect(effectiveStatus("done", false)).toBe("done");
    expect(effectiveStatus("all", false)).toBe("all");
  });
});

describe("篩選選單上的標籤", () => {
  it.each(["all", "done", "reading", "want"] as const)("%s 轉成標籤再轉回來是同一個", (status) => {
    expect(statusFromLabel(statusLabel(status))).toBe(status);
  });

  it("全部是空字串，跟其他篩選一致", () => {
    expect(statusLabel("all")).toBe("");
  });

  it("標題列的「全部」要寫得出來，不能是空字串", () => {
    expect(statusHeading("all")).toBe("全部");
    expect(statusHeading("reading")).toBe("閱讀中");
    expect(statusFromLabel("")).toBe("all");
  });

  it("三個狀態都在選單裡", () => {
    expect(STATUS_LABELS).toEqual(["已讀完", "閱讀中", "想讀"]);
  });
});

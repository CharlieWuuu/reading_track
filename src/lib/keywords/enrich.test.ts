import { describe, expect, it } from "vitest";
import { pendingNames } from "@/lib/keywords/enrich";
import { KeywordInfo } from "@/types/keyword";

const info = (name: string, extra: Partial<KeywordInfo> = {}): KeywordInfo =>
  ({ name, wikiUrl: "", summary: "", topics: "", ...extra }) as KeywordInfo;

describe("pendingNames", () => {
  it("只留主檔裡沒有的", () => {
    expect(pendingNames(["禪", "書法"], [info("禪")])).toEqual(["書法"]);
  });

  it("查過但空的不再問一次", () => {
    expect(pendingNames(["禪"], [info("禪")])).toEqual([]);
  });

  it("retry 時連空的也重查，有資料的仍然跳過", () => {
    const existing = [info("禪"), info("書法", { summary: "字寫得好看" })];
    expect(pendingNames(["禪", "書法"], existing, true)).toEqual(["禪"]);
  });

  it("去掉前後空白，空字串不算一個", () => {
    expect(pendingNames([" 禪 ", "  ", ""], [])).toEqual(["禪"]);
  });
});

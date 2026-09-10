import { describe, expect, it } from "vitest";
import { isUrl } from "./reflections";

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

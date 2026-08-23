import { describe, expect, it } from "vitest";
import { normalizeIsbn } from "./isbn";

describe("normalizeIsbn", () => {
  it("去掉連字號", () => {
    expect(normalizeIsbn("978-986-359-412-3")).toBe("9789863594123");
  });

  it("挑出夾在文字裡的號碼", () => {
    expect(normalizeIsbn("ISBN：9789863594123（平裝）")).toBe("9789863594123");
  });

  it("認得 10 碼與結尾的 X", () => {
    expect(normalizeIsbn("986359412X")).toBe("986359412X");
  });

  it("長度不對的一律不認", () => {
    expect(normalizeIsbn("12345")).toBe("");
    expect(normalizeIsbn("123456789012345678")).toBe("");
  });

  it("空值回空字串", () => {
    expect(normalizeIsbn(null)).toBe("");
    expect(normalizeIsbn("")).toBe("");
  });
});

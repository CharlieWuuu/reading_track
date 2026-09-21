import { describe, expect, it } from "vitest";
import { CRUMB_MAX, truncateChars } from "./truncate";

describe("truncateChars", () => {
  it("沒超過就原樣回傳", () => {
    expect(truncateChars("紀錄", CRUMB_MAX)).toBe("紀錄");
    expect(truncateChars("一二三四五六", CRUMB_MAX)).toBe("一二三四五六");
  });

  it("超過就切到上限再加刪節號", () => {
    expect(truncateChars("一二三四五六七", CRUMB_MAX)).toBe("一二三四五六…");
  });

  it("按字數算，不按 UTF-16 長度", () => {
    expect(truncateChars("👍👍👍", 2)).toBe("👍👍…");
  });
});

import { describe, expect, it } from "vitest";
import { lonelySectionKey, type Section } from "./section-list";

const half = (key: string): Section => ({ key, label: key, node: null });
const full = (key: string): Section => ({ ...half(key), fullWidth: true });

describe("lonelySectionKey", () => {
  it("半排的塊數是偶數就沒有落單的", () => {
    expect(lonelySectionKey([half("a"), half("b")])).toBeUndefined();
  });

  it("奇數時是最後一塊", () => {
    expect(lonelySectionKey([half("a"), half("b"), half("c")])).toBe("c");
  });

  it("fullWidth 不參與配對——它本來就佔一整排", () => {
    // 概覽（fullWidth）＋兩塊半排：配得成對，沒有落單的
    expect(lonelySectionKey([full("overview"), half("a"), half("b")])).toBeUndefined();
    // 概覽＋三塊半排：最後一塊落單
    expect(lonelySectionKey([full("overview"), half("a"), half("b"), half("c")])).toBe("c");
  });

  it("只有一塊半排時它自己就是落單的", () => {
    expect(lonelySectionKey([full("overview"), half("a")])).toBe("a");
  });

  it("全部都是 fullWidth 就沒有落單的", () => {
    expect(lonelySectionKey([full("a"), full("b")])).toBeUndefined();
  });

  it("空的不會爆", () => {
    expect(lonelySectionKey([])).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { formatSpan } from "./keyword";

/**
 * 起訖年拆成兩個數字欄之後，原本那一整組剖析測試（破折號四種寫法、西元前的
 * 負號跟分隔符撞在一起、月日要忽略、iOS 舊版 Safari 不支援 lookbehind）
 * 全部沒有對象了——那些情況只存在於「一欄塞兩個值」的世界。
 */
describe("formatSpan", () => {
  it("兩邊都有就用破折號接起來", () => {
    expect(formatSpan(1818, 1883)).toBe("1818－1883");
  });

  it("兩邊都空就是空字串", () => {
    expect(formatSpan(null, null)).toBe("");
  });

  it("只有起沒有訖（還活著、還在）就留後面空著", () => {
    expect(formatSpan(1935, null)).toBe("1935－");
  });

  it("起訖同一年就不重複寫兩次", () => {
    expect(formatSpan(1949, 1949)).toBe("1949");
  });

  it("負數是西元前", () => {
    expect(formatSpan(-384, -322)).toBe("前384－前322");
  });

  it("只有訖沒有起", () => {
    expect(formatSpan(null, 2008)).toBe("－2008");
  });
});

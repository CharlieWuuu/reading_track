import { describe, expect, it } from "vitest";
import { formatSpan, parseSpan } from "./keyword";

describe("parseSpan", () => {
  it("一般的生卒", () => {
    expect(parseSpan("1818－1883")).toEqual({ from: 1818, to: 1883 });
  });

  it("破折號有好幾種寫法", () => {
    for (const dash of ["－", "–", "—", "-"]) {
      expect(parseSpan(`1818${dash}1883`)).toEqual({ from: 1818, to: 1883 });
    }
  });

  it("只有一個年份時，起訖相同", () => {
    expect(parseSpan("1949")).toEqual({ from: 1949, to: 1949 });
  });

  it("月日忽略掉，只取年", () => {
    expect(parseSpan("1949/4/6－2020/1/1")).toEqual({ from: 1949, to: 2020 });
  });

  // 分隔符前面必須是數字，「日－」不算，所以整串當成一個年份。
  // 這是原本就有的行為，不是 lookbehind 改寫時弄出來的
  it("破折號前面是中文字時不切", () => {
    expect(parseSpan("1949年4月6日－2020年1月1日")).toEqual({ from: 1949, to: 1949 });
  });

  it("西元前用「前」或負號都認得", () => {
    expect(parseSpan("前384－前322")).toEqual({ from: -384, to: -322 });
    expect(parseSpan("-384–-322")).toEqual({ from: -384, to: -322 });
  });

  it("開頭的負號不是分隔符——負號前面要有數字才算", () => {
    expect(parseSpan("-384")).toEqual({ from: -384, to: -384 });
  });

  it("空白與純文字回 null", () => {
    expect(parseSpan("")).toBeNull();
    expect(parseSpan("不知道")).toBeNull();
  });
});

describe("formatSpan", () => {
  it("兩邊都有就用破折號接起來", () => {
    expect(formatSpan("1818", "1883")).toBe("1818－1883");
  });

  it("兩邊都空就是空字串", () => {
    expect(formatSpan("", "")).toBe("");
  });
});

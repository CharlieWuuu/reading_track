import { describe, expect, it } from "vitest";
import { moedictFields, wiktionaryFields } from "./dict-parse";

describe("moedictFields", () => {
  it("注音放發音、釋義去掉連結標記", () => {
    const fields = moedictFields({
      h: [{ b: "ㄒㄩㄝˊ ㄒㄧˊ", d: [{ f: "`研習~、`鑽研~。" }, { f: "`效法~。" }] }],
    });
    expect(fields).toEqual({ pronunciation: "ㄒㄩㄝˊ ㄒㄧˊ", translation: "研習、鑽研。；效法。" });
  });

  it("最多收三條釋義", () => {
    const d = [{ f: "一" }, { f: "二" }, { f: "三" }, { f: "四" }];
    expect(moedictFields({ h: [{ d }] })?.translation).toBe("一；二；三");
  });

  it("沒有釋義就當查不到", () => {
    expect(moedictFields({})).toBeNull();
    expect(moedictFields({ h: [{ b: "ㄅ", d: [] }] })).toBeNull();
  });
});

describe("wiktionaryFields", () => {
  it("詞性加釋義，去掉 html", () => {
    const fields = wiktionaryFields({
      en: [
        {
          partOfSpeech: "Noun",
          definitions: [{ definition: 'A <a href="/wiki/x">fortunate</a> &amp; lucky find.' }],
        },
      ],
    });
    expect(fields).toEqual({ translation: "Noun：A fortunate & lucky find." });
  });

  it("只收英文，其他語言不算", () => {
    expect(
      wiktionaryFields({ fr: [{ partOfSpeech: "Nom", definitions: [{ definition: "x" }] }] }),
    ).toBeNull();
  });
});

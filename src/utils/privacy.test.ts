import { describe, expect, it } from "vitest";
import { makeBook, makeJournal, resetIds } from "@/testing/factories";
import { isPrivate, isUnlocked, passcodeToToken, tokenToStored, withPrivacy } from "./privacy";

resetIds();

const NO_OPTIONS = { kinds: new Set<string>(), types: new Set<string>() };
const locked = { unlocked: false, options: NO_OPTIONS };

describe("isPrivate", () => {
  it("個別列標了就是私人", () => {
    expect(isPrivate(makeJournal({ private: "是" }))).toBe(true);
  });

  it("認得幾種常見的寫法，大小寫不拘", () => {
    for (const mark of ["是", "y", "YES", "true", "1", "私人"]) {
      expect(isPrivate(makeJournal({ private: mark }))).toBe(true);
    }
  });

  it("沒標又沒清單就是公開", () => {
    expect(isPrivate(makeJournal())).toBe(false);
  });

  it("類型在清單裡，整批算私人", () => {
    const options = { ...NO_OPTIONS, kinds: new Set(["日記"]) };
    expect(isPrivate(makeJournal({ kind: "日記" }), options)).toBe(true);
    expect(isPrivate(makeJournal({ kind: "書籍" }), options)).toBe(false);
  });

  it("屬性在清單裡的書也算私人", () => {
    const options = { ...NO_OPTIONS, types: new Set(["工作"]) };
    expect(isPrivate(makeBook({ type: "工作" }), options)).toBe(true);
    expect(isPrivate(makeBook({ type: "閒書" }), options)).toBe(false);
  });

  // 兩張清單各自對到各自的欄位，混用會讓「私人屬性」意外藏掉書寫
  it("類型清單不會去比對屬性欄", () => {
    const options = { ...NO_OPTIONS, kinds: new Set(["工作"]) };
    expect(isPrivate(makeBook({ type: "工作" }), options)).toBe(false);
  });

  it("空字串的類型不會對上空清單以外的東西", () => {
    const options = { ...NO_OPTIONS, kinds: new Set([""]) };
    expect(isPrivate(makeJournal({ kind: "" }), options)).toBe(false);
  });
});

describe("withPrivacy", () => {
  it("鎖著就把私人的整列拿掉", () => {
    const rows = [makeJournal({ id: "a" }), makeJournal({ id: "b", private: "是" })];

    expect(withPrivacy(rows, locked).map((r) => r.id)).toEqual(["a"]);
  });

  it("解鎖了就原樣回傳，清單也不管用", () => {
    const rows = [makeJournal({ id: "a", kind: "日記" }), makeJournal({ id: "b", private: "是" })];
    const unlocked = { unlocked: true, options: { ...NO_OPTIONS, kinds: new Set(["日記"]) } };

    expect(withPrivacy(rows, unlocked).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("解鎖權杖", () => {
  // 存進 Sheet 的是再雜湊過的一份，被看到也不能直接拿去當權杖
  it("Sheet 上存的那份跟瀏覽器拿的那份不一樣", () => {
    const token = passcodeToToken("開門");
    expect(tokenToStored(token)).not.toBe(token);
  });

  it("同一個密碼算出同一個權杖", () => {
    expect(passcodeToToken("開門")).toBe(passcodeToToken("開門"));
  });

  it("前後空白不影響", () => {
    expect(passcodeToToken("  開門 ")).toBe(passcodeToToken("開門"));
  });

  it("對得起來才算解鎖", () => {
    const token = passcodeToToken("開門");
    expect(isUnlocked(token, tokenToStored(token))).toBe(true);
    expect(isUnlocked(passcodeToToken("別的"), tokenToStored(token))).toBe(false);
  });

  // 沒設過密碼的人不該因為亂帶一個權杖就看到東西
  it("沒設過密碼一律當鎖著", () => {
    expect(isUnlocked(passcodeToToken("開門"), "")).toBe(false);
    expect(isUnlocked(null, tokenToStored(passcodeToToken("開門")))).toBe(false);
  });
});

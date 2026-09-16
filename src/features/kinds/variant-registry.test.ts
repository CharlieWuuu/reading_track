import { describe, expect, it } from "vitest";
import { variantFor } from "./variant-registry";

/**
 * 網址那一段是「詞」而不是編號的類型，通用編輯頁接不住——它會拿那一段去查
 * catalog，查不到就永遠卡在載入中（不是錯誤畫面，所以點下去只是沒反應）。
 *
 * 真的發生過：一次重構把六支實體編輯頁一起收掉，registry 只補了 detail，
 * 單字與關鍵字的編輯就這樣靜悄悄地壞掉。
 */
const WORD_KEYED = ["vocabulary", "keywords"];

describe("認詞不認編號的類型", () => {
  it.each(WORD_KEYED)("%s 有專屬詳情頁", (slug) => {
    expect(variantFor(slug).detail).toBeDefined();
  });

  it.each(WORD_KEYED)("%s 有專屬編輯頁", (slug) => {
    expect(variantFor(slug).edit).toBeDefined();
  });
});

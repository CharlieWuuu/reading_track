import { describe, expect, it } from "vitest";
import { variantFor } from "./variant-registry";

/**
 * 片段一律走通用頁：勾了哪些模組就畫哪幾格，設定頁說了算。
 *
 * 佳句、單字、關鍵字本來有專屬的詳情與編輯頁，那幾支是手寫的 JSX——
 * 七格寫死的輸入框，完全不讀 setting_map_kind_field。使用者在設定頁改模組，
 * 那幾頁一格都不會變，「內部連結」「私人」這種每個類型都有的也畫不出來。
 *
 * 舊版的這支測試守的是反面：確保那三種「有」專屬頁，因為它們的網址用「詞」
 * 不用編號，通用頁拿詞去查 catalog 會卡在載入中。那個前提已經拿掉了——
 * fragmentHref 改用 id，資料本來就一列一筆。
 */
const GENERIC = ["quotes", "vocabulary"];

describe("片段走通用頁", () => {
  it.each(GENERIC)("%s 沒有專屬詳情頁", (slug) => {
    expect(variantFor(slug).detail).toBeUndefined();
  });

  it.each(GENERIC)("%s 沒有專屬編輯頁", (slug) => {
    expect(variantFor(slug).edit).toBeUndefined();
  });

  it("認不得的 slug 回空的，不是壞掉", () => {
    expect(variantFor("影集")).toEqual({});
  });
});

/**
 * 還沒通用化的那幾種。書籍與文章的詳情頁有自己的東西（書封牆、重讀紀錄），
 * 書寫那條路（/writings/writing）在 setting_kinds 裡根本沒有對應的類型。
 *
 * 關鍵字卡在資料那一層：它的主檔以名字當身分、沒有 id，網址也用詞。
 * 通用頁拿詞去查 catalog 查不到，會卡在載入中——所以在那條路改完之前，
 * 專屬頁不能拆。這一條守的就是「別再一次拆掉、讓編輯靜悄悄壞掉」。
 */
describe("還留著專屬詳情頁的", () => {
  it.each(["books", "articles", "writing", "keywords"])("%s 有專屬詳情頁", (slug) => {
    expect(variantFor(slug).detail).toBeDefined();
  });

  it("關鍵字的編輯也還在——網址用詞，通用編輯頁接不住", () => {
    expect(variantFor("keywords").edit).toBeDefined();
  });
});

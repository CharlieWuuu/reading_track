import { describe, expect, it } from "vitest";
import { checkImage, imageKey, imageSrc, isImageKey, MAX_BYTES } from "@/utils/image-key";

const USER = "11111111-1111-4111-8111-111111111111";

describe("checkImage", () => {
  it("認得的型別回副檔名", () => {
    expect(checkImage("image/jpeg", 100)).toEqual({ ok: true, ext: "jpg" });
    expect(checkImage("image/webp", 100)).toEqual({ ok: true, ext: "webp" });
  });

  it("不收的型別擋下來", () => {
    expect(checkImage("image/avif", 100).ok).toBe(false);
    expect(checkImage("application/pdf", 100).ok).toBe(false);
  });

  it("太大與空檔都擋", () => {
    expect(checkImage("image/png", MAX_BYTES + 1).ok).toBe(false);
    expect(checkImage("image/png", 0).ok).toBe(false);
  });
});

describe("imageKey", () => {
  it("開頭是 userId，副檔名接在後面", () => {
    const key = imageKey(USER, "jpg");
    expect(key.startsWith(`${USER}/`)).toBe(true);
    expect(key.endsWith(".jpg")).toBe(true);
    expect(isImageKey(key)).toBe(true);
  });

  it("每次都不一樣", () => {
    expect(imageKey(USER, "jpg")).not.toBe(imageKey(USER, "jpg"));
  });
});

describe("isImageKey", () => {
  it("擋掉想跳出自己資料夾的 key", () => {
    expect(isImageKey("../secrets/a.jpg")).toBe(false);
    expect(isImageKey(`${USER}/../x.jpg`)).toBe(false);
  });

  it("外部網址不是 key", () => {
    expect(isImageKey("https://example.com/a.jpg")).toBe(false);
  });
});

describe("imageSrc", () => {
  it("key 走自家代理", () => {
    const key = imageKey(USER, "png");
    expect(imageSrc(key)).toBe(`/api/image?key=${encodeURIComponent(key)}`);
  });

  // 轉存還沒做完，舊資料照樣要看得到
  it("外部網址原樣回傳", () => {
    expect(imageSrc("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });

  it("空字串還是空字串", () => {
    expect(imageSrc("")).toBe("");
  });
});

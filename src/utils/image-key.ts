/**
 * 圖片的 key。存進 cover_url 那一欄的就是這個字串，不是網址——
 * 網址會因為 bucket 搬家或簽名過期而失效，key 不會。
 */

/** 收得下的圖片格式。avif 不收：Safari 舊版看不到，存進去等於存了個看不見的檔案 */
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_BYTES = 5 * 1024 * 1024;

export type ImageCheck = { ok: true; ext: string } | { ok: false; error: string };

/** 型別與大小都對才收。檔名不看——使用者傳什麼名字都不影響存進去的 key */
export function checkImage(type: string, size: number): ImageCheck {
  const ext = TYPES[type];
  if (!ext) return { ok: false, error: "只收 JPEG、PNG、WebP、GIF" };
  if (size > MAX_BYTES) return { ok: false, error: "圖片不能超過 5 MB" };
  if (size === 0) return { ok: false, error: "圖片是空的" };
  return { ok: true, ext };
}

/**
 * key 長 `<userId>/<隨機>.<副檔名>`。
 *
 * 開頭放 userId 是為了刪帳號時一整個前綴刪掉就乾淨了；
 * 隨機那段讓 key 猜不到——私有 bucket 之外的第二層保險。
 */
export function imageKey(userId: string, ext: string): string {
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

/** 只認自己產的形狀，擋掉 `../` 之類想跳出去的 key */
export function isImageKey(value: string): boolean {
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(value);
}

/** 這一欄存的是 key 還是舊的外部網址——轉存期間兩種會並存 */
export const isExternalUrl = (value: string): boolean => /^https?:\/\//.test(value);

/** 畫面上要用的 src。key 走自家代理，外部網址原樣回傳 */
export function imageSrc(value: string): string {
  if (!value) return "";
  return isImageKey(value) ? `/api/image?key=${encodeURIComponent(value)}` : value;
}

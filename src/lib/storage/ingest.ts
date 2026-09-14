import { storage } from "@/lib/storage/client";
import { checkImage, imageKey, isExternalUrl } from "@/utils/image-key";

/**
 * 外部圖片轉存進自己的 bucket。
 *
 * 抓回來的書封是別人家的網址：對方改版、防盜連、關站，書單就整排破圖。
 * 存進來之後那一欄就跟外面無關了。
 *
 * 轉存失敗不算錯——原本那個網址還是能看，留著比整筆存不進去好。
 */

/** 抓圖的逾時。書封通常幾十 KB，慢成這樣多半是對方擋了 */
const TIMEOUT_MS = 8000;

export async function ingestImage(userId: string, url: string): Promise<string> {
  if (!url || !isExternalUrl(url)) return url; // 已經是 key 或空的就不用動

  const bucket = storage();
  if (!bucket) return url; // 沒設定就照舊用外部網址，不擋住寫入

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return url;

    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const blob = await res.blob();

    const check = checkImage(type, blob.size);
    if (!check.ok) return url;

    const key = imageKey(userId, check.ext);
    const { error } = await bucket.upload(key, blob, { contentType: type, upsert: false });
    if (error) {
      console.warn("ingest image failed:", url, error.message);
      return url;
    }
    return key;
  } catch (err) {
    console.warn("ingest image failed:", url, err);
    return url;
  }
}

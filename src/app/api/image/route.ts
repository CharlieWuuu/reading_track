import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  guarded,
  requireSession,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { storage } from "@/lib/storage/client";
import { checkImage, imageKey, isImageKey } from "@/utils/image-key";

/**
 * 自己的圖片。bucket 是私有的，所以讀也要經過這裡——
 * `<img>` 帶不了 Authorization header，但 cookie 會自己跟著走。
 *
 * 存進資料庫的是 key 不是網址：bucket 搬家、簽名過期都不會讓舊資料失效。
 */

/** 簽名網址的效期。只是拿來在伺服器內部抓檔案，不會外流給瀏覽器 */
const SIGNED_SECONDS = 60;

export const POST = guarded("image upload", async (req: NextRequest) => {
  const session = await requireWriter();
  if (!session?.user?.id) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("沒有收到檔案");

  const check = checkImage(file.type, file.size);
  if (!check.ok) return badRequest(check.error);

  const key = imageKey(session.user.id, check.ext);
  const { error } = await storage.upload(key, file, {
    contentType: file.type,
    // key 是隨機的，不會撞；真的撞了寧可失敗也不要蓋掉別人的圖
    upsert: false,
  });
  if (error) {
    console.error("image upload failed:", error);
    return NextResponse.json({ error: "上傳失敗" }, { status: 502 });
  }

  return NextResponse.json({ key });
});

export const GET = guarded("image read", async (req: NextRequest) => {
  const session = await requireSession();
  if (!session?.user?.id) return unauthorized();

  const key = req.nextUrl.searchParams.get("key");
  if (!key || !isImageKey(key)) return badRequest("key 不合法");

  // key 開頭就是擁有者，比對不過就當作不存在——不回 403，那等於告訴對方這個 key 有東西
  if (!key.startsWith(`${session.user.id}/`)) {
    return NextResponse.json({ error: "找不到這張圖" }, { status: 404 });
  }

  const { data, error } = await storage.createSignedUrl(key, SIGNED_SECONDS);
  if (error || !data) {
    return NextResponse.json({ error: "找不到這張圖" }, { status: 404 });
  }

  const upstream = await fetch(data.signedUrl);
  if (!upstream.ok) return NextResponse.json({ error: "取不到圖片" }, { status: 502 });

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // 同一個 key 的內容永遠不變（改圖等於換一個 key），但這是私人的，
      // 只讓瀏覽器自己存，不進共用 CDN
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
});

import { NextRequest, NextResponse } from "next/server";
import { NDL_REFERER, NDL_THUMBNAIL_HOST } from "@/lib/metadata/ndl";

/**
 * 書封代理。
 *
 * 國會圖書館的 thumbnail 服務會檢查 Referer 防盜連：瀏覽器直接載入會被回 403，
 * 只有帶著它自家 Referer 的請求才拿得到圖，所以日文書的書封一律經過這裡。
 *
 * 只放行白名單上的主機，不然這條路由就變成任何人都能用的開放代理。
 */
const ALLOWED_HOSTS = new Set([NDL_THUMBNAIL_HOST]);

const HEADERS_BY_HOST: Record<string, Record<string, string>> = {
  [NDL_THUMBNAIL_HOST]: NDL_REFERER,
};

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) return NextResponse.json({ error: "缺少 src" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "src 不是合法網址" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "不支援這個來源" }, { status: 400 });
  }

  const upstream = await fetch(target, { headers: HEADERS_BY_HOST[target.hostname] });
  if (!upstream.ok || !(upstream.headers.get("content-type") ?? "").startsWith("image/")) {
    return NextResponse.json({ error: "取不到書封" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // 書封不會變，讓瀏覽器與 CDN 存久一點，省下每次翻頁的往返
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
}

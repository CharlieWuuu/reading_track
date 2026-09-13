import { NextRequest, NextResponse } from "next/server";
import { guarded, requireSession, unauthorized } from "@/app/api/_lib/respond";
import { PRIVACY_SETTING_KEY } from "@/config/privacy";
import { readPrivacySettings } from "@/lib/db/queries/settings";
import { isUnlocked, tokenToStored } from "@/utils/privacy";

/**
 * 解鎖為什麼沒生效——只回傳判斷過程，不回傳任何私人內容，也不回傳雜湊本身。
 *
 * 這支是為了查一個「畫面看不到私人項目、但每一段程式看起來都對」的問題加的。
 * 查完就該刪掉。
 */
export const GET = guarded("privacy debug GET", async (req: NextRequest) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const token = req.nextUrl.searchParams.get("unlock");
  const { stored, privateTypes } = await readPrivacySettings(session.user.id, PRIVACY_SETTING_KEY);

  return NextResponse.json({
    userId: session.user.id.slice(0, 8),
    hasToken: Boolean(token),
    tokenLength: token?.length ?? 0,
    hasStored: Boolean(stored),
    storedLength: stored.length,
    // 兩邊的雜湊前幾碼：對不上就知道是權杖算錯，不是過濾寫錯
    tokenHashHead: token ? tokenToStored(token).slice(0, 8) : null,
    storedHead: stored.slice(0, 8),
    unlocked: isUnlocked(token, stored),
    privateTypes,
  });
});

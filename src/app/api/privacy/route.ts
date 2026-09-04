import { NextRequest, NextResponse } from "next/server";
import { PRIVACY_SETTING_KEY } from "@/config/privacy";
import { auth } from "@/lib/auth";
import { readSetting, writeSetting } from "@/lib/db/queries/settings";
import { isUnlocked, passcodeToToken, tokenToStored } from "@/utils/privacy";

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

/** 有沒有設過密碼。前端靠它決定要問密碼還是請你先設一個 */
export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  try {
    const stored = await readSetting(PRIVACY_SETTING_KEY);
    return NextResponse.json({ hasPasscode: Boolean(stored) });
  } catch (err) {
    console.error("readSetting failed:", err);
    return NextResponse.json({ error: "讀取失敗" }, { status: 502 });
  }
}

/**
 * set：第一次設密碼，或改密碼（改密碼要先給舊的）。
 * verify：解鎖，對了就回傳權杖，之後每次讀清單都帶著它。
 */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { action, passcode, current } = (await req.json()) as {
    action?: "set" | "verify";
    passcode?: string;
    current?: string;
  };
  if (!action || !passcode?.trim()) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    const stored = await readSetting(PRIVACY_SETTING_KEY);
    const token = passcodeToToken(passcode);

    if (action === "verify") {
      if (!isUnlocked(token, stored)) {
        return NextResponse.json({ error: "密碼不對" }, { status: 403 });
      }
      return NextResponse.json({ token });
    }

    // 已經有密碼的話，改密碼要先證明你知道舊的
    if (stored && !isUnlocked(passcodeToToken(current ?? ""), stored)) {
      return NextResponse.json({ error: "原本的密碼不對" }, { status: 403 });
    }
    await writeSetting(PRIVACY_SETTING_KEY, tokenToStored(token));
    return NextResponse.json({ token });
  } catch (err) {
    console.error("privacy update failed:", err);
    return NextResponse.json({ error: "寫入失敗" }, { status: 502 });
  }
}

export const maxDuration = 30;

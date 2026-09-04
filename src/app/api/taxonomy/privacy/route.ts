import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setPrivacyFlag, type PrivacyTarget } from "@/lib/db/mutations/taxonomy";
import { privacyFlags } from "@/lib/db/queries/taxonomy";

const TARGETS: PrivacyTarget[] = ["type", "writingType", "keyword"];

async function requireUser() {
  const session = await auth();
  return session?.user ? session : null;
}

/** 設定頁那份清單：類型樹、書寫類型、關鍵字，各自帶著現在的旗標 */
export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  try {
    return NextResponse.json(await privacyFlags());
  } catch (err) {
    console.error("privacyFlags failed:", err);
    return NextResponse.json({ error: "讀取失敗" }, { status: 502 });
  }
}

/** 標記或取消一個節點 */
export async function PATCH(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { target, id, isPrivate } = (await req.json()) as {
    target?: PrivacyTarget;
    id?: string;
    isPrivate?: boolean;
  };
  if (!target || !TARGETS.includes(target) || !id || typeof isPrivate !== "boolean") {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await setPrivacyFlag(target, id, isPrivate);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("setPrivacyFlag failed:", err);
    return NextResponse.json({ error: "寫入失敗" }, { status: 502 });
  }
}

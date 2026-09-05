import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  readJsonBody,
  readOnly,
  requireSession,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { setPrivacyFlag, type PrivacyTarget } from "@/lib/db/mutations/taxonomy";
import { privacyFlags } from "@/lib/db/queries/taxonomy";

const TARGETS: PrivacyTarget[] = ["type", "writingType"];

/** 設定頁那份清單：類型樹、書寫類型、關鍵字，各自帶著現在的旗標 */
export const GET = guarded("taxonomy privacy GET", async () => {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    return NextResponse.json(await privacyFlags(session.user.id));
  } catch (err) {
    return dataFailure("讀取", "privacyFlags", err);
  }
});

/** 標記或取消一個節點 */
export const PATCH = guarded("taxonomy privacy PATCH", async (req: NextRequest) => {
  const session = await requireWriter();
  if (!session) return readOnly();

  const body = await readJsonBody<{ target?: PrivacyTarget; id?: string; isPrivate?: boolean }>(
    req,
    "taxonomy privacy",
  );
  const { target, id, isPrivate } = body ?? {};
  if (!target || !TARGETS.includes(target) || !id || typeof isPrivate !== "boolean") {
    return badRequest("缺少必要欄位");
  }

  try {
    await setPrivacyFlag(session.user.id, target, id, isPrivate);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dataFailure("寫入", "setPrivacyFlag", err);
  }
});

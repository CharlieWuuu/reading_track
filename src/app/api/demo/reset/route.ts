import { NextRequest, NextResponse } from "next/server";
import { guarded } from "@/app/api/_lib/respond";
import { DEMO_EMAIL } from "@/config/demo";
import { seedDemo } from "@/lib/demo/seed";

/**
 * demo 資料每天洗一次。訪客可以隨便改，隔天回到乾淨的樣子。
 *
 * Vercel 的 cron 會帶 `Authorization: Bearer $CRON_SECRET`，沒設 CRON_SECRET
 * 就一律拒絕——這支會清資料，不能讓任何人打得到。
 * 正式站沒設 DEMO_EMAIL，打到這裡什麼也不會發生。
 */
export const maxDuration = 60;

export const GET = guarded("demo reset", async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "不給進" }, { status: 401 });
  }
  if (!DEMO_EMAIL) return NextResponse.json({ skipped: "這個部署不是 demo" });

  const summary = await seedDemo(DEMO_EMAIL);
  console.log("demo reset:", summary);
  return NextResponse.json({ ok: true, summary });
});

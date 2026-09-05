import { readSetting, writeSetting } from "@/lib/db/queries/settings";

/**
 * demo 訪客的每日額度。維基與 Google Books 那條路要打外部 API，
 * 開放給陌生人就得有個上限——但也不必小氣，本人一天也用不到這個數。
 *
 * 計數存在 settings（一天一列，key 帶日期），跨實例才算得準。
 */
export const DEMO_DAILY_LIMIT = 100;

const keyFor = (day: string) => `demo_enrich_${day}`;

const today = () => new Date().toISOString().slice(0, 10);

export async function takeDemoQuota(userId: string, count: number): Promise<boolean> {
  const key = keyFor(today());
  const used = Number(await readSetting(userId, key)) || 0;
  if (used + count > DEMO_DAILY_LIMIT) return false;

  await writeSetting(userId, key, String(used + count));
  return true;
}

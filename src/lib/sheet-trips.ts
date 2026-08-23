/**
 * 數這一分鐘打了幾趟 Google Sheets API。
 *
 * 配額本身就是以分鐘計的（每使用者每分鐘 60 次讀取），所以數「這一分鐘幾趟」
 * 比數「這個請求幾趟」更接近會不會爆。
 *
 * **只記次數，不記內容**：log 會留在 Vercel，而每一趟裡面都是使用者的資料。
 */
const WINDOW_MS = 60_000;

/** 上限的三分之二就出聲：還沒爆，但已經該看一眼了 */
const WARN_AT = 40;

let stamps: number[] = [];
let warned = false;

/** 包住一趟真的會連到 Google 的呼叫 */
export async function trip<T>(run: () => Promise<T>): Promise<T> {
  const now = Date.now();
  stamps = stamps.filter((t) => now - t < WINDOW_MS);
  stamps.push(now);

  if (stamps.length >= WARN_AT && !warned) {
    warned = true;
    console.warn(`sheets: 這一分鐘已經 ${stamps.length} 趟（每分鐘上限 60）`);
  } else if (stamps.length < WARN_AT) {
    warned = false; // 降回門檻以下才允許再警告一次，不然會每一趟都印
  }

  return run();
}

/** 給測試與診斷用；正常流程不需要讀它 */
export function tripsInLastMinute(): number {
  const now = Date.now();
  stamps = stamps.filter((t) => now - t < WINDOW_MS);
  return stamps.length;
}

export function resetTrips() {
  stamps = [];
  warned = false;
}

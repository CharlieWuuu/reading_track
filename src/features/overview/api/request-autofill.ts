import { AutofillSlug } from "@/config/autofill-sources";
import { AutofillQuery } from "@/utils/autofill";

export type AutofillFound = { source: AutofillSlug; fields: Record<string, string> };

/** 查不到回 null；來源壞掉或沒登入丟錯，訊息直接給畫面顯示 */
export async function requestAutofill(
  sources: readonly AutofillSlug[],
  query: AutofillQuery,
): Promise<AutofillFound | null> {
  const res = await fetch("/api/autofill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sources, ...query }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "補齊失敗");
  return data.found ?? null;
}

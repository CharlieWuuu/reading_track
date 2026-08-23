/**
 * 解鎖或設定私人項目的密碼。
 *
 * 回傳的 token 放 sessionStorage（關分頁就鎖回去），之後每支會回傳內容的 API
 * 都靠它決定要不要把私人的那幾列送出來——過濾一律在伺服器端。
 */
export async function submitPasscode(input: {
  sheetId: string;
  /** set＝設定新密碼（要附 current），verify＝解鎖 */
  action: "set" | "verify";
  passcode: string;
  current: string;
}): Promise<{ token: string }> {
  const res = await fetch("/api/privacy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "解鎖失敗");
  return data;
}

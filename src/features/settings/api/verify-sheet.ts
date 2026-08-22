/** 連接前先確認這份 Sheet 讀得到，順便拿它自己的標題當備援檔名 */
export async function verifySheet(sheetId: string): Promise<{ title?: string }> {
  const res = await fetch("/api/sheet/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "連接失敗");
  return data;
}

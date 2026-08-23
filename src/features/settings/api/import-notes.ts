export type ImportPreview = { pending: number; titles: string[] };

/** 先看會搬幾筆再決定要不要按，不要按下去才知道 */
export async function previewImportNotes(sheetId: string): Promise<ImportPreview | null> {
  const res = await fetch(`/api/writings/import-notes?sheetId=${encodeURIComponent(sheetId)}`);
  const data = await res.json().catch(() => null);
  if (!data || data.error) return null;
  return { pending: data.pending, titles: data.titles ?? [] };
}

/** 真的搬。回傳搬了幾筆（欄位名跟著 route 走） */
export async function importNotes(sheetId: string): Promise<{ migrated: number }> {
  const res = await fetch("/api/writings/import-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "搬移失敗");
  return data;
}

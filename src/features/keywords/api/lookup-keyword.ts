import { KeywordInfo } from "@/types/keyword";

/** 拿名字去查維基，補主檔的 topics／座標／生卒／摘要 */
export async function lookupKeyword(name: string): Promise<KeywordInfo> {
  const res = await fetch("/api/keywords/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "查詢失敗");
  return data.keyword as KeywordInfo;
}

"use client";

import { useKindRecords } from "@/hooks/use-kind-records";

/** uuid 長這樣。不是就是名字——舊的關鍵字連結用詞當網址 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 網址上那一段換成真正的編號。
 *
 * 關鍵字的連結一直用「詞」當網址（`/fragments/keywords/馬克思`），因為主檔
 * 以名字當身分。通用詳情頁拿那一段去查 catalog 查不到，只能卡在載入中——
 * 所以那一種只好自己寫一套專屬頁，而那套是寫死的，設定頁改模組畫面不會變。
 *
 * 這裡把兩種都接住：是編號就直接用，是名字就去這個類型裡找同名的第一筆。
 * 站內還有很多地方只拿得到名字（書上的 keywords 是純文字欄），
 * 全部改成帶編號要動的地方太多，讓網址自己認得出來比較實際。
 */
export function useRecordId(kindId: string, segment: string): { id: string; isLoading: boolean } {
  const decoded = decodeURIComponent(segment);
  const looksLikeId = UUID.test(decoded);

  // 已經是編號就不用撈——多一次請求只為了查一件已經知道的事
  const { fragments, isLoading } = useKindRecords(looksLikeId ? "" : kindId);

  if (looksLikeId) return { id: decoded, isLoading: false };

  const match = fragments.find((row) => row.title === decoded);
  return { id: match?.id ?? "", isLoading };
}

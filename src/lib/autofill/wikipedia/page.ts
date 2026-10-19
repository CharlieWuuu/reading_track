import { fetchJson } from "@/lib/metadata/http";
import { WikiPage } from "@/types/wiki";

const WIKI_API = "https://zh.wikipedia.org/w/api.php";

type WikiResponse = { query?: { pages?: WikiPage[] } };

/**
 * 條目名反查。`converttitles` 一定要帶：中文維基的條目只存在其中一種字體下，
 * 「後殖民主義」查不到而「后殖民主义」查得到，差別只在繁簡。
 */
export async function fetchPage(title: string): Promise<WikiPage | null> {
  if (!title) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    converttitles: "zh",
    prop: "extracts|coordinates|pageprops",
    // 條目的 {{coord}} 沒標 display=title 就會被記成非主座標，預設查不出來（臺北市就是）
    coprimary: "all",
    colimit: "10",
    exintro: "1",
    explaintext: "1",
    titles: title,
  });

  const data = await fetchJson<WikiResponse>(`${WIKI_API}?${params}`);
  const page = data?.query?.pages?.[0];
  if (!page || page.missing) return null;
  // 消歧義頁不是條目：它沒有座標也沒有生卒，摘要只是一串「可能是指」，
  // 存進主檔只會製造看起來有資料其實沒有的列。當成查不到，讓使用者把詞寫具體一點。
  if (page.pageprops?.disambiguation !== undefined) return null;
  return page;
}

/**
 * 最後一次機會：`srwhat=nearmatch` 只回「幾乎就是這個標題」的條目，
 * 對不上就回空——這不是模糊搜尋，猜錯條目的風險仍然沒有放進來。
 */
export async function nearMatch(name: string): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    list: "search",
    srwhat: "nearmatch",
    srsearch: name,
  });
  const data = await fetchJson<{ query?: { search?: Array<{ title?: string }> } }>(
    `${WIKI_API}?${params}`,
  );
  return data?.query?.search?.[0]?.title ?? "";
}

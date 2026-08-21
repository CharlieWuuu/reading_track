import type { CheerioAPI } from "cheerio";
import { SECTIGO_EV_R36_PEM } from "./certs";
import { digitsOnly } from "./html";
import { fetchDom } from "./http";
import { normalizeLanguage } from "./readmoo";
import { BookMetadata, Candidate, MetadataProvider } from "./types";

/**
 * 商品資訊是一排 `<span class="prodInfo_boldSpan">標籤：<span>值</span></span>`。
 * 這裡照結構取值，而不是用整頁純文字配對「標籤：值」——欄位之間沒有分隔符，
 * 純文字會把「繁體中文裝訂方式」黏成一個值。
 */
function prodInfo($: CheerioAPI): Map<string, string> {
  const info = new Map<string, string>();
  $(".prodInfo_boldSpan").each((_, el) => {
    const cell = $(el);
    const label = cell
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .replace(/[:：\s]*$/, "")
      .trim();
    const value = cell.children("span").first().text().trim();
    if (label && value && !info.has(label)) info.set(label, value);
  });
  return info;
}

/**
 * 讀冊生活（TAAZE）。搜尋頁與商品頁都是伺服器渲染的靜態 HTML，直接抓就好。
 *
 * 存在的理由是「讀墨在 Vercel 上抓不到」：讀墨掛在 CloudFront 後面，
 * 對機房 IP 一律回 403，所以本機查得到、線上永遠查不到。讀冊沒有這道封鎖，
 * 而且中文書的欄位比讀墨更完整（多了實體書頁數），是線上環境的主力來源。
 *
 * 連線一律要帶 extraCa：讀冊送出的憑證鏈缺了中介憑證，理由見 certs.ts。
 */
const TLS = { extraCa: SECTIGO_EV_R36_PEM };

export const taazeProvider: MetadataProvider = {
  name: "讀冊生活",

  findCandidates: async (query) => {
    const $ = await fetchDom(
      `https://www.taaze.tw/rwd_searchResult.html?keyType%5B%5D=0&keyword%5B%5D=${encodeURIComponent(
        query,
      )}`,
      TLS,
    );
    if (!$) return [];

    const candidates: Candidate[] = [];
    $('a[href*="/products/"]').each((_, el) => {
      const href = $(el).attr("href")?.split("?")[0];
      const title = ($(el).attr("title") || $(el).text()).trim();
      if (!href || !title) return;
      if (candidates.some((c) => c.url === href)) return;
      candidates.push({ title, url: href });
    });
    return candidates;
  },

  fetchDetail: async (url) => {
    const $ = await fetchDom(url, TLS);
    if (!$) return null;

    // og:title 格式："書名- TAAZE 讀冊生活"
    const raw = $('meta[property="og:title"]').attr("content") ?? $("title").text();
    const title = raw.replace(/\s*-\s*TAAZE.*$/, "").trim();
    if (!title) return null;

    const info = prodInfo($);
    const metadata: BookMetadata = {
      title,
      author: $(".authorBrand a")
        .map((_, a) => $(a).text().trim())
        .get()
        .join(", "),
      publisher: info.get("出版社") ?? "",
      language: normalizeLanguage(info.get("語言") ?? ""),
      pageCount: digitsOnly(info.get("頁數") ?? ""),
      coverUrl: $('meta[property="og:image"]').attr("content") ?? "",
      source: "讀冊生活",
      sourceUrl: url,
    };
    return metadata;
  },
};

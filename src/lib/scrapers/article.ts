import type { CheerioAPI } from "cheerio";
import { fetchDom } from "@/lib/metadata/http";
import { Article } from "@/types/article";

/**
 * 從網址抓文章的基本資料。
 *
 * 跟書籍爬蟲不同，這裡不用 headless browser：新聞與部落格幾乎都有 OpenGraph
 * 或 JSON-LD，那是標準化的 meta 標籤，一支通用解析器就吃得下大部分站台，
 * 也不必替每個站台各寫一份、跟著它們改版壞掉。
 */
export type ScrapedArticle = Partial<Pick<Article, "title" | "author" | "platform" | "wordCount">>;

function meta($: CheerioAPI, names: string[]): string {
  for (const name of names) {
    const value = $(`meta[property="${name}"], meta[name="${name}"]`).attr("content");
    if (value?.trim()) return value.trim();
  }
  return "";
}

/** JSON-LD 可能是單一物件、陣列，或包在 @graph 裡，三種都要攤平 */
function jsonLdNodes($: CheerioAPI): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        nodes.push(item);
        const graph = (item as { "@graph"?: unknown })["@graph"];
        if (Array.isArray(graph)) nodes.push(...graph.filter((g) => g && typeof g === "object"));
      }
    } catch {
      // 壞掉的 JSON-LD 很常見，跳過就好
    }
  });
  return nodes;
}

/** author 可能是字串、物件，或兩者的陣列 */
function nameOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(nameOf).filter(Boolean).join("、");
  if (value && typeof value === "object") {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string") return name.trim();
  }
  return "";
}

/** article:author 常常放的是臉書粉專網址或 @帳號，那都不是人名 */
function isName(value: string): boolean {
  return Boolean(value) && !/^https?:\/\//i.test(value) && !value.startsWith("@");
}

/** 標題尾巴常黏著站台名（「A Chain Reaction — overreacted」），跟平台重複就切掉 */
function stripSiteSuffix(title: string, site: string): string {
  if (!site) return title;
  // 站台名是網域時，尾巴多半只寫主網域（overreacted.io -> overreacted），兩種都試
  for (const name of [site, site.split(".")[0]]) {
    const trimmed = title
      .replace(new RegExp(`\\s*[-–—|｜:：]\\s*${escapeRegExp(name)}\\s*$`, "i"), "")
      .trim();
    if (trimmed && trimmed !== title) return trimmed;
  }
  return title;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function scrapeArticleUrl(url: string): Promise<ScrapedArticle> {
  const $ = await fetchDom(url);
  if (!$) throw new Error("讀不到這個網址");

  const nodes = jsonLdNodes($);
  const pick = (key: string) => {
    for (const node of nodes) {
      const value = node[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  };

  const title =
    meta($, ["og:title", "twitter:title"]) ||
    nameOf(pick("headline")) ||
    $("title").first().text().trim();

  // 不看 twitter:creator：那多半是站台自己的帳號代碼，不是這篇的作者
  const authorMeta = meta($, ["article:author", "author", "byl"]);
  const author = isName(authorMeta) ? authorMeta : nameOf(pick("author"));

  const publisher = nameOf(pick("publisher"));
  const platform = meta($, ["og:site_name"]) || publisher || hostname(url);

  // 只有站台自己報字數才填；自己數頁面文字會把導覽列和留言一起數進去
  const rawWordCount = pick("wordCount");
  const wordCount =
    typeof rawWordCount === "number" || typeof rawWordCount === "string"
      ? String(rawWordCount).replace(/[^\d]/g, "")
      : "";

  return {
    title: stripSiteSuffix(title, platform),
    author: isName(author) ? author : "",
    platform,
    wordCount,
  };
}

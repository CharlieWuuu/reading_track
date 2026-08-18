import { fetchDom, fetchJson, fetchText } from "@/lib/metadata/http";

/**
 * 抓一篇發表出去的文章現在有多少人看。
 *
 * 只支援拿得到數字的平台。Medium 直接回 403（機器人偵測，跟博客來、Kobo 同一種），
 * 開 headless 瀏覽器也未必過得了而且很脆，所以不支援——那種就手動填。
 */
export type PublishStats = {
  platform: string;
  views: string;
  /** 「真的讀了」的人數，只有 vocus 分得出來 */
  reads: string;
  /** 順便帶回來的標題，表單可以拿去補空的標題欄 */
  title: string;
};

type Fetcher = {
  platform: string;
  matches: (url: string) => boolean;
  fetch: (url: string) => Promise<PublishStats | null>;
};

/** HackMD 的 /info 直接回 JSON，不用登入 */
const hackmd: Fetcher = {
  platform: "HackMD",
  matches: (url) => /(^|\/\/)([^/]*\.)?hackmd\.io\//i.test(url),
  fetch: async (url) => {
    const id = new URL(url).pathname.split("/").filter(Boolean)[0];
    if (!id) return null;

    const info = await fetchJson<{ title?: string; viewcount?: number }>(
      `https://hackmd.io/${id}/info`,
    );
    if (!info || info.viewcount === undefined) return null;

    return {
      platform: "HackMD",
      views: String(info.viewcount),
      reads: "",
      title: info.title?.trim() ?? "",
    };
  },
};

/**
 * vocus 把數字嵌在頁面的 JSON 裡，一般 fetch 就拿得到。
 * pageview 是點進來的、readCount 是真的讀了的，兩個都存。
 */
const vocus: Fetcher = {
  platform: "vocus",
  matches: (url) => /(^|\/\/)([^/]*\.)?vocus\.cc\//i.test(url),
  fetch: async (url) => {
    const html = await fetchText(url);
    if (!html) return null;

    const number = (key: string) => html.match(new RegExp(`"${key}":\\s*(\\d+)`))?.[1] ?? "";
    const views = number("pageview");
    if (!views) return null;

    const $ = await fetchDom(url);
    const title = $?.('meta[property="og:title"]').attr("content")?.trim() ?? "";

    return { platform: "vocus", views, reads: number("readCount"), title };
  },
};

const FETCHERS: Fetcher[] = [hackmd, vocus];

export const SUPPORTED_PLATFORMS = FETCHERS.map((f) => f.platform).join("、");

export async function fetchPublishStats(url: string): Promise<PublishStats> {
  const fetcher = FETCHERS.find((f) => f.matches(url));
  if (!fetcher) {
    throw new Error(`只支援 ${SUPPORTED_PLATFORMS}，其他平台請手動填`);
  }

  const stats = await fetcher.fetch(url);
  if (!stats) throw new Error(`讀不到${fetcher.platform}的數據`);
  return stats;
}

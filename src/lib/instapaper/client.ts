import { buildOAuthHeader } from "./oauth";

const BASE_URL = "https://www.instapaper.com/api/1";

function requireEnv() {
  const consumerKey = process.env.INSTAPAPER_CONSUMER_KEY;
  const consumerSecret = process.env.INSTAPAPER_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("缺少 Instapaper Consumer Key/Secret 設定");
  }
  return { consumerKey, consumerSecret };
}

export interface InstapaperAccessToken {
  token: string;
  tokenSecret: string;
}

export async function getAccessToken(
  username: string,
  password: string
): Promise<InstapaperAccessToken> {
  const { consumerKey, consumerSecret } = requireEnv();
  const url = `${BASE_URL}/oauth/access_token`;
  const params = { x_auth_username: username, x_auth_password: password, x_auth_mode: "client_auth" };

  const authHeader = buildOAuthHeader({
    method: "POST",
    url,
    params,
    consumerKey,
    consumerSecret,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    throw new Error("Instapaper 登入失敗，請確認帳號密碼");
  }

  const text = await res.text();
  const parsed = new URLSearchParams(text);
  const token = parsed.get("oauth_token");
  const tokenSecret = parsed.get("oauth_token_secret");
  if (!token || !tokenSecret) {
    throw new Error("Instapaper 回應格式異常");
  }

  return { token, tokenSecret };
}

export interface InstapaperBookmark {
  bookmark_id: number;
  title: string;
  url: string;
  time: number;
  progress: number;
  progress_timestamp: number;
  starred: string;
}

async function listBookmarksInFolder(
  access: InstapaperAccessToken,
  folder: "unread" | "archive" | "starred"
): Promise<InstapaperBookmark[]> {
  const { consumerKey, consumerSecret } = requireEnv();
  const url = `${BASE_URL}/bookmarks/list`;
  const params = { folder_id: folder, limit: "50" };

  const authHeader = buildOAuthHeader({
    method: "POST",
    url,
    params,
    consumerKey,
    consumerSecret,
    token: access.token,
    tokenSecret: access.tokenSecret,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    throw new Error("讀取 Instapaper 文章失敗");
  }

  const data = await res.json();
  return (data as unknown[]).filter(
    (item): item is InstapaperBookmark =>
      typeof item === "object" && item !== null && (item as { type?: string }).type === "bookmark"
  );
}

export async function listBookmarks(
  access: InstapaperAccessToken
): Promise<InstapaperBookmark[]> {
  const [unread, archived] = await Promise.all([
    listBookmarksInFolder(access, "unread"),
    listBookmarksInFolder(access, "archive"),
  ]);

  const merged = new Map<number, InstapaperBookmark>();
  for (const b of [...unread, ...archived]) {
    merged.set(b.bookmark_id, b);
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = a.progress_timestamp || a.time;
    const bTime = b.progress_timestamp || b.time;
    return bTime - aTime;
  });
}

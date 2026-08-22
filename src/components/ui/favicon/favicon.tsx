"use client";

import { useState } from "react";

/**
 * 站台圖示，當文章的縮圖用。
 *
 * 不存進 Sheet：它從來源網址推得出來，存一份只會多一欄跟著網址一起腐爛的資料。
 *
 * 用 DuckDuckGo 而不是 Google 的 favicon 服務：這個 app 本來就登著 Google 帳號，
 * 拿 google.com 抓圖等於把「我讀了哪些站」跟帳號綁在同一個請求上。要換供應商
 * 只要改這一行。
 */
const ICON_URL = (host: string) => `https://icons.duckduckgo.com/ip3/${host}.ico`;

function hostOf(url: string): string {
  try {
    return new URL(url.trim()).hostname;
  } catch {
    return "";
  }
}

/** 抓不到圖（或根本沒網址）就退回站名或標題的第一個字，不留一塊空白 */
export function Favicon({
  url,
  fallback,
  className = "size-6",
}: {
  url: string;
  fallback: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const host = hostOf(url);

  if (!host || failed) {
    return (
      <span
        className={`rounded-thumb flex shrink-0 items-center justify-center bg-gray-100 text-[10px] leading-none text-gray-400 ${className}`}
      >
        {fallback.trim().slice(0, 1) || "—"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ICON_URL(host)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-thumb shrink-0 object-contain ${className}`}
    />
  );
}

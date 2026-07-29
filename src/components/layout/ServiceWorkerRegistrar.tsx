"use client";

import { useEffect } from "react";

/** 註冊 service worker，讓網站可以被「加入主畫面」當成 App 使用 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // 開發模式不註冊，免得快取擋住熱更新
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 註冊失敗不影響一般使用，安靜略過就好
    });
  }, []);

  return null;
}

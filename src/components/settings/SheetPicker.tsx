"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
    google: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new (viewId: string) => GoogleDocsView;
        ViewId: { SPREADSHEETS: string };
        Action: { PICKED: string };
      };
    };
  }
  interface GooglePickerBuilder {
    addView: (view: GoogleDocsView) => GooglePickerBuilder;
    setOAuthToken: (token: string) => GooglePickerBuilder;
    setDeveloperKey: (key: string) => GooglePickerBuilder;
    setAppId: (appId: string) => GooglePickerBuilder;
    setCallback: (cb: (data: PickerResponse) => void) => GooglePickerBuilder;
    build: () => { setVisible: (visible: boolean) => void };
  }
  interface GoogleDocsView {
    setMimeTypes: (mimeTypes: string) => GoogleDocsView;
  }
  interface PickerResponse {
    action: string;
    docs?: { id: string; name: string }[];
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER;

// Picker 的錯誤有時是 Error、有時是純物件，統一轉成看得懂的字串
function describe(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export function SheetPicker({
  onSelect,
}: {
  onSelect: (sheetId: string, name: string) => void;
}) {
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  function handleScriptLoad() {
    window.gapi.load("picker", {
      callback: () => setReady(true),
      onerror: (e: unknown) =>
        setError(`Google Picker 模組載入失敗：${describe(e)}`),
    } as unknown as () => void);
  }

  function openPicker() {
    if (!session?.accessToken) {
      setError("尚未登入，無法開啟選擇器");
      return;
    }
    if (!API_KEY) {
      setError("缺少 NEXT_PUBLIC_GOOGLE_API_KEY（環境變數沒進 build）");
      return;
    }

    try {
      const view = new window.google.picker.DocsView(
        window.google.picker.ViewId.SPREADSHEETS
      ).setMimeTypes("application/vnd.google-apps.spreadsheet");

      const builder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(session.accessToken)
        .setDeveloperKey(API_KEY);

      if (APP_ID) builder.setAppId(APP_ID);

      const picker = builder
        .setCallback((data: PickerResponse) => {
          if (data.action === "error" || data.action === "cancel") {
            setError(`Picker 回報：${describe(data)}`);
            return;
          }
          if (data.action === window.google.picker.Action.PICKED && data.docs?.[0]) {
            const doc = data.docs[0];
            onSelect(doc.id, doc.name);
          }
        })
        .build();

      setError("");
      picker.setVisible(true);
    } catch (e) {
      setError(`開啟 Picker 失敗：${describe(e)}`);
    }
  }

  return (
    <div>
      <Script
        src="https://apis.google.com/js/api.js"
        onLoad={handleScriptLoad}
        onError={() =>
          setError("無法載入 https://apis.google.com/js/api.js（被瀏覽器或網路擋掉）")
        }
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={!ready}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {ready ? "選擇 Google Sheet" : "載入中…"}
      </button>
      {error && (
        <div className="mt-2 wrap-break-word rounded bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <Diagnostics />
    </div>
  );
}

// Picker 的 key 檢查是看瀏覽器送出的 referrer，
// 而 referrer 在 PWA／App 內建瀏覽器裡會不一樣，所以直接印出來比對
function Diagnostics() {
  const [info, setInfo] = useState<string[]>([]);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      "standalone" in navigator;
    setInfo([
      `金鑰 ${API_KEY ? `${API_KEY.slice(0, 8)}…（長度 ${API_KEY.length}）` : "未載入"}`,
      `appId ${APP_ID ?? "未設定"}`,
      `網址 ${window.location.href}`,
      `referrer ${document.referrer || "（空的）"}`,
      `開啟方式 ${standalone ? "PWA／獨立視窗" : "一般瀏覽器分頁"}`,
      `cookie ${navigator.cookieEnabled ? "可用" : "被停用"}`,
      `UA ${navigator.userAgent}`,
    ]);
  }, []);

  if (!info.length) return null;

  return (
    <details className="mt-2 text-xs text-gray-500">
      <summary className="cursor-pointer">連線診斷資訊</summary>
      <ul className="mt-1 space-y-0.5 wrap-break-word rounded bg-gray-50 p-2">
        {info.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}

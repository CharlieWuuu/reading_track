"use client";

import { useState } from "react";
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
      <ManualSheetInput onSelect={onSelect} />
    </div>
  );
}

/**
 * Picker 是彈出視窗，在 iOS 加到主畫面的獨立視窗裡會開成空白頁，
 * 所以永遠留一條手動貼網址的路。
 */
function ManualSheetInput({
  onSelect,
}: {
  onSelect: (sheetId: string, name: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = value.trim();
    if (!input) return;

    // 接受完整網址，也接受直接貼 ID
    const fromUrl = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    const id = fromUrl ?? (/^[a-zA-Z0-9-_]{20,}$/.test(input) ? input : null);
    if (!id) {
      setError("看不出 Sheet ID，請貼完整的 Google Sheet 網址");
      return;
    }

    setError("");
    onSelect(id, "");
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <label className="block text-xs text-gray-500">
        或直接貼上 Google Sheet 網址
      </label>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="shrink-0 rounded border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          連接
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}

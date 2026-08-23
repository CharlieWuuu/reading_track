"use client";

import Script from "next/script";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";

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

export function SheetPicker({ onSelect }: { onSelect: (sheetId: string, name: string) => void }) {
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  function handleScriptLoad() {
    window.gapi.load("picker", {
      callback: () => setReady(true),
      onerror: (e: unknown) => setError(`Google Picker 模組載入失敗：${describe(e)}`),
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
        window.google.picker.ViewId.SPREADSHEETS,
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
        onError={() => setError("無法載入 https://apis.google.com/js/api.js（被瀏覽器或網路擋掉）")}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={!ready}
        className="rounded-control bg-control-bg text-control-ink hover:bg-control-bg-hover px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {ready ? "選擇 Google Sheet" : <Spinner size={14} />}
      </button>
      {error && (
        <div className="rounded-control mt-2 bg-red-50 p-2 text-xs wrap-break-word text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

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
      onerror: () => setError("Google Picker 模組載入失敗"),
    } as unknown as () => void);
  }

  function openPicker() {
    if (!session?.accessToken || !API_KEY) {
      setError("尚未登入或缺少設定，無法開啟選擇器");
      return;
    }

    const view = new window.google.picker.DocsView(
      window.google.picker.ViewId.SPREADSHEETS
    ).setMimeTypes("application/vnd.google-apps.spreadsheet");

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(session.accessToken)
      .setDeveloperKey(API_KEY)
      .setCallback((data: PickerResponse) => {
        if (data.action === window.google.picker.Action.PICKED && data.docs?.[0]) {
          const doc = data.docs[0];
          onSelect(doc.id, doc.name);
        }
      })
      .build();

    picker.setVisible(true);
  }

  return (
    <div>
      <Script
        src="https://apis.google.com/js/api.js"
        onLoad={handleScriptLoad}
        onError={() => setError("無法載入 Google API script")}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={!ready}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {ready ? "選擇 Google Sheet" : "載入中…"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
